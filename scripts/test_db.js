const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.careerRole.count();
  const skills = await prisma.skill.count();
  const certifications = await prisma.certification.count();
  const technologies = await prisma.technology.count();
  const users = await prisma.user.count();
  const roadmaps = await prisma.roadmap.count();
  console.log("DATABASE STATUS REPORT:");
  console.log("Roles:", roles);
  console.log("Skills:", skills);
  console.log("Certifications:", certifications);
  console.log("Technologies:", technologies);
  console.log("Users:", users);
  console.log("Roadmaps:", roadmaps);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
