"use client";

import { useState } from "react";

type Props = {
  entityType: "SKILL" | "CERTIFICATION" | "TECHNOLOGY";
  entityId: string;
  label: string;
};

export function FeedbackButtons({ entityType, entityId, label }: Props) {
  const [message, setMessage] = useState("");

  async function send(rating: number) {
    setMessage("");
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId, rating, note: label })
    });
    setMessage(response.ok ? "Saved" : "Failed");
  }

  return (
    <div className="mt-3 flex items-center gap-2 text-xs">
      <button onClick={() => send(5)} className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-200">Helpful</button>
      <button onClick={() => send(1)} className="rounded-full bg-rose-500/15 px-3 py-1 text-rose-200">Not useful</button>
      {message ? <span className="text-slate-400">{message}</span> : null}
    </div>
  );
}
