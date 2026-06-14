"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { executeRoadmapGeneration } from "@/lib/roadmap-service";
import { redirect } from "next/navigation";

export async function generateRoadmap() {
  const user = await requireUser();
  if (!user) redirect("/auth/signin");
  if (!user.profile?.targetRoleId) redirect("/onboarding");

  const profile = user.profile;
  if (!profile.targetRoleId) redirect("/onboarding");

  try {
    await executeRoadmapGeneration(profile.id, profile.targetRoleId);
  } catch (err) {
    console.error("Error generating roadmap in server action:", err);
  }

  redirect("/roadmap");
}

export async function markRoadmapStepComplete(formData: FormData) {
  const user = await requireUser();
  if (!user || !user.profile) redirect("/auth/signin");
  const stepId = String(formData.get("stepId") ?? "");
  const step = await prisma.roadmapStep.findUnique({ where: { id: stepId }, include: { roadmap: true } });
  if (!step || step.roadmap.profileId !== user.profile.id) redirect("/roadmap");
  await prisma.roadmapStep.update({ where: { id: stepId }, data: { completed: !step.completed } });
  redirect("/roadmap");
}
