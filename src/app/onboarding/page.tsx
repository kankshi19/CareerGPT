import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (!user) redirect("/auth/signin");

  // Fetch roles and skills for selector options
  const [roles, skills] = await Promise.all([
    prisma.careerRole.findMany({
      select: { id: true, slug: true, name: true, description: true },
      orderBy: { name: "asc" }
    }),
    prisma.skill.findMany({
      select: { id: true, slug: true, name: true, category: true },
      orderBy: { name: "asc" }
    })
  ]);

  const profile = user.profile;

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-10 backdrop-blur-xl shadow-2xl animate-fade-in-up">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-bold">CareerGPT Onboarding</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {profile ? "Update Your Profile" : "Design Your Path"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Tailor your learning pace, self-assess skills, and let our custom ML intelligence generate your path.
          </p>
        </div>

        <OnboardingWizard roles={roles} skills={skills} profile={profile} />
      </div>
    </main>
  );
}
