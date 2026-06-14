import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8 md:p-16">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">CareerGPT</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight">AI career guidance that turns student profiles into clear role roadmaps.</h1>
          <p className="mt-6 max-w-2xl text-slate-300">Assess skills, find gaps, get project/certification recommendations, and track progress toward target roles.</p>
          <div className="mt-8 flex gap-4">
            <Link className="rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950" href="/onboarding">Start onboarding</Link>
            <Link className="rounded-full border border-white/15 px-5 py-3" href="/dashboard">View dashboard</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

