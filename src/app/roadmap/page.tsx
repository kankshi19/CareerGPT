import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { RoadmapClient } from "./roadmap-client";

export default async function RoadmapPage() {
  const user = await requireUser();
  if (!user) redirect("/auth/signin");
  if (!user.profile) redirect("/onboarding");

  const roadmap = await prisma.roadmap.findFirst({
    where: { profileId: user.profile.id, isActive: true },
    include: { steps: { orderBy: { sortOrder: "asc" } }, role: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <RoadmapClient roadmap={roadmap as any} />
  );
}
