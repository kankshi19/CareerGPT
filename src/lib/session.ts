import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: { include: { currentSkills: { include: { skill: true } }, targetRole: true } } } });
  return user;
}
