import { prisma } from "@/lib/prisma";
import { groqJson } from "@/lib/groq";

export async function executeRoadmapGeneration(profileId: string, roleId: string) {
  // 1. Fetch complete profile with skills
  const profile = await prisma.studentProfile.findUnique({
    where: { id: profileId },
    include: { currentSkills: { include: { skill: true } } }
  });
  if (!profile) throw new Error("Profile not found");

  // 2. Fetch role with skill requirements
  const role = await prisma.careerRole.findUnique({
    where: { id: roleId },
    include: { skillRequirements: { include: { skill: true } } }
  });
  if (!role) throw new Error("Role not found");

  const userSkillIds = profile.currentSkills.map((s) => s.skillId);
  const userSkillMap = new Map(profile.currentSkills.map((s) => [s.skill.slug, s.level]));

  // Calculate missing and baseline skills
  const missingSkills = role.skillRequirements
    .filter((r) => !userSkillIds.includes(r.skillId) || (userSkillMap.get(r.skill.slug) ?? 0) < 3)
    .sort((a, b) => b.importanceScore - a.importanceScore);

  const baselineSkills = role.skillRequirements
    .filter((r) => userSkillIds.includes(r.skillId) && (userSkillMap.get(r.skill.slug) ?? 0) >= 3);

  // Fetch relevant certifications and technologies
  const roleCertifications = await prisma.roleCertification.findMany({
    where: { roleId: role.id },
    include: { certification: true },
    orderBy: { relevanceScore: "desc" }
  });
  const roleTechnologies = await prisma.roleTechnology.findMany({
    where: { roleId: role.id },
    include: { technology: true }
  });
  roleTechnologies.sort((a, b) => Number(b.technology.isHotTechnology) - Number(a.technology.isHotTechnology));

  // 3. Assemble deterministic phase blocks
  const steps: any[] = [];

  // Phase 1: 30-Day Timeline (Core & Immediate Foundation)
  // Take top 2 missing core skills (importance >= 4)
  const p1Skills = missingSkills.filter((s) => s.importanceScore >= 4).slice(0, 2);
  p1Skills.forEach((item, index) => {
    steps.push({
      phase: "30-day",
      title: `Foundations of ${item.skill.name}`,
      description: `Establish a solid foundation in ${item.skill.name}. Work on fundamentals and core syntax.`,
      whyItMatters: `Crucial skill with high importance for ${role.name}.`,
      duration: "2 weeks",
      prerequisites: "None",
      skillFocus: item.skill.name,
      resourceLink: `https://www.google.com/search?q=free+${encodeURIComponent(item.skill.name)}+tutorials`,
      expectedOutcome: `Set up local environments and build 3 basic sample programs using ${item.skill.name}.`,
      priority: "HIGH"
    });
  });

  // If no missing core skills, add a review step
  if (steps.length === 0) {
    steps.push({
      phase: "30-day",
      title: "Skills Review & Project Setup",
      description: `Refine your existing skills in ${baselineSkills.slice(0, 2).map((s) => s.skill.name).join(", ")}.`,
      whyItMatters: "Keeping core baseline skills sharp is essential for backend engineering tasks.",
      duration: "2 weeks",
      prerequisites: "Existing skills",
      skillFocus: baselineSkills[0]?.skill.name ?? "Core Development",
      resourceLink: "https://roadmap.sh",
      expectedOutcome: "Initialize a new GitHub repository with clean documentation.",
      priority: "MEDIUM"
    });
  }

  // Phase 2: 90-Day Timeline (Mid-Term Growth)
  // Take next missing skills (importance 3-4) and top certification
  const p2Skills = missingSkills.filter((s) => s.importanceScore < 4).slice(0, 2);
  p2Skills.forEach((item) => {
    steps.push({
      phase: "90-day",
      title: `Build with ${item.skill.name}`,
      description: `Create mid-sized applications leveraging ${item.skill.name} and common framework design patterns.`,
      whyItMatters: `Required tool for day-to-day development in ${role.name}.`,
      duration: "3 weeks",
      prerequisites: steps.map((s) => s.title).join(", "),
      skillFocus: item.skill.name,
      resourceLink: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(item.skill.name)}`,
      expectedOutcome: `Design and publish a small working library or REST API using ${item.skill.name}.`,
      priority: "MEDIUM"
    });
  });

  if (roleCertifications[0]) {
    const cert = roleCertifications[0].certification;
    steps.push({
      phase: "90-day",
      title: `Certification Prep: ${cert.name}`,
      description: `Study the official exam guide for ${cert.name} and practice mock exam questions.`,
      whyItMatters: `Highly relevant certification issued by ${cert.issuer || "industry leaders"} to prove your expertise.`,
      duration: "4 weeks",
      prerequisites: "Practical development experience",
      skillFocus: cert.name,
      resourceLink: cert.source === "seed" ? "https://www.coursera.org" : "https://learn.microsoft.com",
      expectedOutcome: `Score 80%+ on two consecutive full-length practice exams.`,
      priority: "HIGH"
    });
  }

  // Phase 3: 6-Month Timeline (Advanced Mastery & Capstone)
  // Take remaining missing skills, hot technologies, and capstone task
  const remainingSkills = missingSkills.slice(4, 6);
  remainingSkills.forEach((item) => {
    steps.push({
      phase: "6-month",
      title: `Advanced ${item.skill.name} Integration`,
      description: `Integrate advanced architectures, scaling techniques, and optimizations for ${item.skill.name}.`,
      whyItMatters: `Differentiates you as a high-readiness candidate for ${role.name} roles.`,
      duration: "4 weeks",
      prerequisites: "Completion of Phase 1 and 2",
      skillFocus: item.skill.name,
      resourceLink: "https://github.com",
      expectedOutcome: "Implement caching, asynchronous worker pipelines, and profile runtime performance.",
      priority: "LOW"
    });
  });

  const hotTech = roleTechnologies.find((t) => t.technology.isHotTechnology)?.technology;
  steps.push({
    phase: "6-month",
    title: `Capstone Portfolio Project${hotTech ? ` using ${hotTech.name}` : ""}`,
    description: `Deploy a production-ready application demonstrating design principles, tests, and clean architecture.`,
    whyItMatters: "Your capstone project serves as a concrete resume asset and discussion point for interviews.",
    duration: "6 weeks",
    prerequisites: "Completion of all technical modules",
    skillFocus: hotTech?.name ?? "Full Stack System Design",
    resourceLink: "https://render.com",
    expectedOutcome: "Deploy to a cloud provider, implement CI/CD, and write a thorough README.md with system architecture diagrams.",
    priority: "HIGH"
  });

  const structuredPayload = {
    targetRole: role.name,
    experienceLevel: profile.experienceLevel,
    weeklyLearningHours: profile.weeklyLearningHours,
    missingSkills: missingSkills.map((s) => s.skill.name),
    certifications: roleCertifications.map((r) => r.certification.name),
    hotTechnologies: roleTechnologies.filter((t) => t.technology.isHotTechnology).map((t) => t.technology.name),
    steps
  };

  // 4. Polish with Groq LLM (Layer C)
  const prompt = `You are a Senior AI Career Coach and ML Architect. Optimize this career transition roadmap.
Enhance step titles, outcomes, descriptions, and recommended resource links to be highly action-oriented, technical, and tailored for a student majoring in "${profile.major}" with interests in "${profile.interests}".
Use a coaching tone that is direct, motivating, and suitable for a ${profile.experienceLevel} level.

Here is the structured baseline payload:
${JSON.stringify(structuredPayload)}

Return JSON with exactly these fields:
{
  "summary": "A custom 2-3 sentence motivational overview mapping out their weekly learning strategy of ${profile.weeklyLearningHours} hours and how they will secure the role of ${role.name}.",
  "steps": [
    {
      "phase": "30-day" | "90-day" | "6-month",
      "title": "Short action-oriented title",
      "description": "Clear explanation of what to learn and build",
      "whyItMatters": "Context on how this supports target role",
      "duration": "Duration string (e.g. 2 weeks)",
      "prerequisites": "Prerequisites",
      "skillFocus": "Core skill",
      "resourceLink": "A real, high-quality URL or domain (e.g. https://docs.python.org, https://roadmap.sh)",
      "expectedOutcome": "Measurable checkpoint / project output",
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }
  ]
}`;

  const generated = await groqJson(prompt, {
    summary: `Roadmap mapping out your transition to ${role.name} with a weekly commitment of ${profile.weeklyLearningHours} hours.`,
    steps
  });

  // 5. De-activate old active roadmaps
  await prisma.roadmap.updateMany({
    where: { profileId: profile.id, isActive: true },
    data: { isActive: false, status: "archived" }
  });

  // 6. Create new active roadmap and save steps
  const roadmap = await prisma.roadmap.create({
    data: {
      profileId: profile.id,
      roleId: role.id,
      title: `Custom ${role.name} Path`,
      summary: generated.summary || `Personalized roadmap toward ${role.name}`,
      missingSkills: JSON.stringify(missingSkills.map((s) => s.skill.name)),
      generatedSteps: JSON.stringify(generated.steps ?? []),
      status: "active",
      sourcePayload: JSON.stringify(structuredPayload),
      isActive: true,
      steps: {
        create: (generated.steps ?? []).map((step: any, index: number) => ({
          title: step.title,
          // Serialize rich properties inside description JSON to preserve compatibility
          description: JSON.stringify({
            phase: step.phase,
            whyItMatters: step.whyItMatters || "",
            prerequisites: step.prerequisites || "None",
            expectedOutcome: step.expectedOutcome || "",
            priority: step.priority || "MEDIUM",
            detailText: step.description
          }),
          duration: step.duration,
          skillFocus: step.skillFocus,
          resourceLink: step.resourceLink || null,
          sortOrder: index + 1
        }))
      }
    },
    include: { steps: { orderBy: { sortOrder: "asc" } }, role: true }
  });

  return roadmap;
}
