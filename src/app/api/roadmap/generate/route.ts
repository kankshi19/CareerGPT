import { requireUser } from "@/lib/session";
import { executeRoadmapGeneration } from "@/lib/roadmap-service";
import { redirect } from "next/navigation";

export async function POST() {
  const user = await requireUser();
  if (!user) redirect("/auth/signin");
  if (!user.profile) return Response.json({ error: "Complete onboarding first" }, { status: 409 });
  if (!user.profile.targetRoleId) return Response.json({ error: "Select a target role" }, { status: 409 });

  try {
    const roadmap = await executeRoadmapGeneration(user.profile.id, user.profile.targetRoleId);
    return Response.json({ roadmap });
  } catch (err: any) {
    console.error("Roadmap generation endpoint error:", err);
    return Response.json({ error: err.message || "Failed to generate roadmap" }, { status: 500 });
  }
}

export async function GET() {
  const user = await requireUser();
  if (!user) redirect("/auth/signin");
  if (!user.profile) return Response.json({ error: "Complete onboarding first" }, { status: 409 });

  const { prisma } = await import("@/lib/prisma");
  const roadmap = await prisma.roadmap.findFirst({
    where: { profileId: user.profile.id, isActive: true },
    include: { steps: { orderBy: { sortOrder: "asc" } }, role: true },
    orderBy: { createdAt: "desc" }
  });
  return Response.json({ roadmap });
}
