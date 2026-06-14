"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/dashboard" });
    if (result?.error) return setError("Invalid email or password");
    router.push("/dashboard");
  }

  return (
    <main className="p-8">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" />
          <input name="password" type="password" placeholder="Password" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button className="w-full rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950" type="submit">Sign in</button>
        </form>
      </div>
    </main>
  );
}
