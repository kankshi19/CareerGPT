import { prisma } from "@/lib/prisma";

export async function GET() {
  const roles = await prisma.careerRole.findMany({
    include: {
      skillRequirements: { include: { skill: true } }
    },
    orderBy: { name: "asc" }
  });
  return Response.json({ roles });
}
