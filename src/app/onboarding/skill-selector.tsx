"use client";

import { useMemo, useState } from "react";

type Skill = { id: string; name: string; slug: string };
type CurrentSkill = { skill: { slug: string }; level: number };

export function SkillSelector({ skills, selected }: { skills: Skill[]; selected: Set<string> }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter((skill) => skill.name.toLowerCase().includes(q) || skill.slug.toLowerCase().includes(q));
  }, [query, skills]);

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Current skills</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills..."
          className="w-full max-w-xs rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm"
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {filtered.map((skill) => (
          <label key={skill.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" name="skills" value={skill.slug} defaultChecked={selected.has(skill.slug)} />
              <span>{skill.name}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{skill.slug}</p>
            <select
              name={`skill-${skill.slug}`}
              defaultValue="3"
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="1">Beginner</option>
              <option value="2">Basic</option>
              <option value="3">Intermediate</option>
              <option value="4">Advanced</option>
              <option value="5">Expert</option>
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
