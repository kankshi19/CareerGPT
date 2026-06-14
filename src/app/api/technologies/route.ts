import { prisma } from "@/lib/prisma";

export async function GET() {
  const technologies = await prisma.technology.findMany({ orderBy: [{ isHotTechnology: "desc" }, { name: "asc" }] });
  return Response.json({ technologies });
}
