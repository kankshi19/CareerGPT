import { prisma } from "@/lib/prisma";

export async function getCatalog() {
  const [roles, skills, certifications, technologies, roleSkills, roleCertifications, roleTechnologies] = await Promise.all([
    prisma.careerRole.findMany(),
    prisma.skill.findMany(),
    prisma.certification.findMany(),
    prisma.technology.findMany(),
    prisma.roleSkillRequirement.findMany({ include: { skill: true } }),
    prisma.roleCertification.findMany({ include: { certification: true } }),
    prisma.roleTechnology.findMany({ include: { technology: true } })
  ]);
  return { roles, skills, certifications, technologies, roleSkills, roleCertifications, roleTechnologies };
}
