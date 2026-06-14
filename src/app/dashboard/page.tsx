import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/auth/signin");
  if (!user.profile) redirect("/onboarding");

  // Fetch all roles to feed comparative options
  const rolesList = await prisma.careerRole.findMany({
    select: { id: true, name: true, description: true }
  });

  return (
    <DashboardClient
      initialProfile={user.profile}
      rolesList={rolesList}
    />
  );
}
