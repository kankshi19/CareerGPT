import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export async function GET() {
  const user = await requireUser();
  if (!user) redirect("/auth/signin");
  return Response.json({ profile: user.profile });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      fullName,
      educationLevel,
      major,
      interests,
      preferredRoles,
      weeklyLearningHours,
      experienceLevel,
      preferredLearningStyle,
      targetRoleId,
      skills // Array of { slug: string, level: number }
    } = body;

    const profile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: fullName || null,
        educationLevel: educationLevel || "",
        major: major || "",
        interests: interests || "",
        preferredRoles: preferredRoles || "",
        weeklyLearningHours: Number(weeklyLearningHours) || 5,
        experienceLevel: experienceLevel || "",
        preferredLearningStyle: preferredLearningStyle || "",
        targetRoleId: targetRoleId || null
      },
      create: {
        userId: user.id,
        fullName: fullName || null,
        educationLevel: educationLevel || "",
        major: major || "",
        interests: interests || "",
        preferredRoles: preferredRoles || "",
        weeklyLearningHours: Number(weeklyLearningHours) || 5,
        experienceLevel: experienceLevel || "",
        preferredLearningStyle: preferredLearningStyle || "",
        targetRoleId: targetRoleId || null
      }
    });

    // Handle skill updates if provided
    if (Array.isArray(skills)) {
      await prisma.userSkill.deleteMany({ where: { profileId: profile.id } });
      if (skills.length > 0) {
        const skillSlugs = skills.map((s) => s.slug);
        const dbSkills = await prisma.skill.findMany({ where: { slug: { in: skillSlugs } } });
        const dbSkillsMap = new Map(dbSkills.map((s) => [s.slug, s.id]));

        const userSkillsData = skills
          .filter((s) => dbSkillsMap.has(s.slug))
          .map((s) => ({
            profileId: profile.id,
            skillId: dbSkillsMap.get(s.slug)!,
            level: Number(s.level) || 3
          }));

        if (userSkillsData.length > 0) {
          await prisma.userSkill.createMany({ data: userSkillsData });
        }
      }
    }

    return Response.json({ success: true, profile });
  } catch (e: any) {
    return Response.json({ error: e.message || "Failed to save profile" }, { status: 500 });
  }
}

