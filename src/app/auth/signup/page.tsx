"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Signup failed");
      return;
    }
    const email = String(payload.email ?? "");
    const password = String(payload.password ?? "");
    await signIn("credentials", { email, password, redirect: false, callbackUrl: "/onboarding" });
    router.push("/onboarding");
  }

  return (
    <main className="p-8">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-semibold">Sign up</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input name="name" placeholder="Name" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" />
          <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" />
          <input name="password" type="password" placeholder="Password" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button className="w-full rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950" type="submit">Create account</button>
        </form>
      </div>
    </main>
  );
}
