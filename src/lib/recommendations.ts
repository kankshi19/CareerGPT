import { CareerRole, Certification, RoleCertification, RoleSkillRequirement, RoleTechnology, Skill, Technology } from "@prisma/client";
import { spawnSync } from "child_process";
import path from "path";

export function readinessScore(params: {
  userSkills: { skill: Skill; level: number }[];
  required: (RoleSkillRequirement & { skill: Skill })[];
}) {
  const known = new Map(params.userSkills.map((s) => [s.skill.id, s.level]));
  const core = params.required.filter((r) => r.requirementType === "core");
  const secondary = params.required.filter((r) => r.requirementType !== "core");
  const coreScore = core.reduce((sum, r) => sum + Math.min(known.get(r.skillId) ?? 0, 5) / 5, 0) / Math.max(core.length, 1);
  const secondaryScore = secondary.reduce((sum, r) => sum + Math.min(known.get(r.skillId) ?? 0, 5) / 5, 0) / Math.max(secondary.length, 1);
  return Math.round(Math.min(100, coreScore * 65 + secondaryScore * 25 + Math.min(params.userSkills.length * 2, 10)));
}

export function skillGaps(required: (RoleSkillRequirement & { skill: Skill })[], userSkills: { skill: Skill; level: number }[]) {
  const known = new Map(userSkills.map((s) => [s.skill.id, s.level]));
  return required
    .filter((r) => (known.get(r.skillId) ?? 0) < 3)
    .sort((a, b) => b.importanceScore - a.importanceScore);
}

export function explainRole(role: CareerRole, gaps: (RoleSkillRequirement & { skill: Skill })[]) {
  return `${role.name} requires ${gaps.slice(0, 3).map((g) => g.skill.name).join(", ")} and related experience.`;
}

export function mapHotTechnologies(technologies: (Technology & { roles?: RoleTechnology[] })[]) {
  return technologies.filter((t) => t.isHotTechnology).map((t) => t.name);
}

export function certify(roleCerts: (RoleCertification & { certification: Certification })[]) {
  return roleCerts.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function getMLRecommendations(profile: {
  fullName: string | null;
  educationLevel: string;
  major: string;
  interests: string;
  preferredRoles: string;
  experienceLevel: string;
  currentSkills: Record<string, number>;
}): {
  id: string;
  slug: string;
  title: string;
  description: string;
  matchScore: number;
  metrics: {
    skillsOverlapRatio: number;
    skillsAverageLevel: number;
    interestsSimilarity: number;
    majorSimilarity: number;
    experienceMatch: number;
  };
}[] {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "recommend.py");
    const input = JSON.stringify(profile);
    const proc = spawnSync("python", [scriptPath], {
      input,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    });
    if (proc.status === 0) {
      return JSON.parse(proc.stdout.trim());
    } else {
      console.error("ML Inference process failed:", proc.stderr);
      return [];
    }
  } catch (err) {
    console.error("ML Inference error:", err);
    return [];
  }
}

