import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { groqJson } from "@/lib/groq";
import { getMLRecommendations, readinessScore, skillGaps } from "@/lib/recommendations";
import { redirect } from "next/navigation";

export async function GET() {
  const user = await requireUser();
  if (!user) redirect("/auth/signin");
  if (!user.profile) return Response.json({ error: "Complete onboarding first" }, { status: 409 });

  const profile = user.profile;
  const roleId = profile.targetRoleId ?? profile.targetRole?.id;
  if (!roleId) return Response.json({ error: "Select a target role" }, { status: 409 });

  const role = await prisma.careerRole.findUnique({
    where: { id: roleId },
    include: { skillRequirements: { include: { skill: true } } }
  });
  if (!role) return Response.json({ error: "Role not found" }, { status: 404 });

  const userSkills = profile.currentSkills.map((skill) => ({ skill: skill.skill, level: skill.level }));
  const gaps = skillGaps(role.skillRequirements, userSkills);
  const matched = role.skillRequirements.filter((req) => userSkills.some((u) => u.skill.id === req.skillId && u.level >= 3));

  const certifications = await prisma.roleCertification.findMany({
    where: { roleId: role.id },
    include: { certification: true },
    orderBy: { relevanceScore: "desc" }
  });
  const technologies = await prisma.roleTechnology.findMany({
    where: { roleId: role.id },
    include: { technology: true }
  });
  technologies.sort((a, b) => Number(b.technology.isHotTechnology) - Number(a.technology.isHotTechnology));

  // 1. Load ML Recommendations
  const userSkillsMap: Record<string, number> = {};
  for (const us of profile.currentSkills) {
    userSkillsMap[us.skill.slug] = us.level;
  }
  const profileInput = {
    fullName: profile.fullName,
    educationLevel: profile.educationLevel,
    major: profile.major,
    interests: profile.interests,
    preferredRoles: profile.preferredRoles,
    experienceLevel: profile.experienceLevel,
    currentSkills: userSkillsMap
  };
  const alternativeRoles = getMLRecommendations(profileInput);

  const dbPayload = {
    role: { id: role.id, name: role.name, description: role.description },
    readinessScore: readinessScore({ userSkills, required: role.skillRequirements }),
    matchedSkills: matched.map((m) => m.skill.name),
    missingSkills: gaps.map((g) => g.skill.name),
    certifications: certifications.map((r) => ({
      id: r.certification.id,
      name: r.certification.name,
      issuer: r.certification.issuer,
      relevanceScore: r.relevanceScore
    })),
    technologies: technologies.map((r) => ({
      id: r.technology.id,
      name: r.technology.name,
      isHotTechnology: r.technology.isHotTechnology,
      commodityTitle: r.technology.commodityTitle
    })),
    alternativeRoles
  };

  const explanation = await groqJson(
    `Return JSON with fields summary, whyThisRole, recommendedStudyFocus, and coachTone based only on this payload: ${JSON.stringify(dbPayload)}`,
    {
      summary: `You are building toward ${role.name}.`,
      whyThisRole: role.description,
      recommendedStudyFocus: dbPayload.missingSkills.slice(0, 3),
      coachTone: "direct and motivating"
    }
  );

  const recommendationSnapshot = {
    ...dbPayload,
    explanation,
    recommendations: [
      ...gaps.slice(0, 5).map((gap) => ({
        type: "SKILL",
        title: `Strengthen ${gap.skill.name}`,
        reason: `Required for ${role.name} and currently below target level.`,
        supportsTargetRole: role.name,
        addressesMissingSkill: gap.skill.name,
        hotTechnologyRelevance: false,
        certificationRelevance: false,
        difficulty: gap.importanceScore >= 4 ? "Hard" : "Medium"
      })),
      ...certifications.slice(0, 3).map((item) => ({
        type: "CERTIFICATION",
        title: item.certification.name,
        reason: `Relevant certification for ${role.name}.`,
        supportsTargetRole: role.name,
        addressesMissingSkill: gaps[0]?.skill.name ?? null,
        hotTechnologyRelevance: false,
        certificationRelevance: true,
        difficulty: "Medium"
      })),
      ...technologies.slice(0, 5).map((item) => ({
        type: "TECHNOLOGY",
        title: item.technology.name,
        reason: item.technology.isHotTechnology ? "Hot technology for this role." : "Relevant tool for the role.",
        supportsTargetRole: role.name,
        addressesMissingSkill: gaps[0]?.skill.name ?? null,
        hotTechnologyRelevance: item.technology.isHotTechnology,
        certificationRelevance: false,
        difficulty: "Medium"
      }))
    ]
  };

  return Response.json(recommendationSnapshot);
}

