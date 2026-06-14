export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type RecommendationItem = {
  id: string;
  type: "SKILL" | "PROJECT" | "CERTIFICATION" | "RESOURCE" | "INTERNSHIP";
  title: string;
  reason: string;
  role: string;
  gap: string;
  difficulty: string;
  outcome: string;
  score: number;
};

