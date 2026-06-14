import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ResumeStudioClient } from "./resume-studio-client";

export default async function ResumeStudioPage() {
  const session = await requireUser();
  if (!session) {
    redirect("/login");
  }

  // Get user profile to determine default target role
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { targetRole: true }
  });

  const roles = await prisma.careerRole.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <ResumeStudioClient roles={roles} defaultRoleId={profile?.targetRoleId || ""} />
      </div>
    </div>
  );
}
