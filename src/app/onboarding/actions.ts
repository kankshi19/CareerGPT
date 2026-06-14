"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

function list(value: FormDataEntryValue | null) {
  return String(value ?? "").split(",").map((v) => v.trim()).filter(Boolean);
}

export async function saveOnboarding(formData: FormData) {
  const user = await requireUser();
  if (!user) redirect("/auth/signin");

  const skills = formData.getAll("skills").map((value) => String(value).trim()).filter(Boolean);
  const targetRoleId = String(formData.get("targetRoleId") ?? "").trim() || null;
  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {
      fullName: String(formData.get("fullName") ?? "").trim() || null,
      educationLevel: String(formData.get("educationLevel") ?? "").trim(),
      major: String(formData.get("major") ?? "").trim(),
      interests: String(formData.get("interests") ?? "").trim(),
      preferredRoles: String(formData.get("preferredRoles") ?? "").trim(),
      weeklyLearningHours: Number(formData.get("weeklyLearningHours") ?? 0),
      experienceLevel: String(formData.get("experienceLevel") ?? "").trim(),
      preferredLearningStyle: String(formData.get("preferredLearningStyle") ?? "").trim(),
      targetRoleId
    },
    create: {
      userId: user.id,
      fullName: String(formData.get("fullName") ?? "").trim() || null,
      educationLevel: String(formData.get("educationLevel") ?? "").trim(),
      major: String(formData.get("major") ?? "").trim(),
      interests: String(formData.get("interests") ?? "").trim(),
      preferredRoles: String(formData.get("preferredRoles") ?? "").trim(),
      weeklyLearningHours: Number(formData.get("weeklyLearningHours") ?? 0),
      experienceLevel: String(formData.get("experienceLevel") ?? "").trim(),
      preferredLearningStyle: String(formData.get("preferredLearningStyle") ?? "").trim(),
      targetRoleId
    }
  });

  await prisma.userSkill.deleteMany({ where: { profileId: profile.id } });
  if (skills.length) {
    const existingSkills = await prisma.skill.findMany({ where: { slug: { in: skills } } });
    await prisma.userSkill.createMany({
      data: existingSkills.map((skill) => ({
        profileId: profile.id,
        skillId: skill.id,
        level: Number(formData.get(`skill-${skill.slug}`) ?? 3)
      }))
    });
  }

  redirect("/dashboard");
}
