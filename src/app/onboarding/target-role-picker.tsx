"use client";

import { useMemo, useState } from "react";

type Role = { id: string; name: string };

export function TargetRolePicker({ roles, defaultValue }: { roles: Role[]; defaultValue: string }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((role) => role.name.toLowerCase().includes(q));
  }, [query, roles]);

  return (
    <div className="md:col-span-2">
      <label className="text-sm text-slate-300">Target role</label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search target roles..."
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
      />
      <select name="targetRoleId" defaultValue={defaultValue} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
        <option value="">Select a role</option>
        {filtered.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-slate-500">{filtered.length} roles found</p>
    </div>
  );
}
