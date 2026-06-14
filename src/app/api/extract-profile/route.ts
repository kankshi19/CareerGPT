// Polyfills for Node environment to satisfy pdfjs-dist internals
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class {};
}
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class {
    constructor() {}
  };
}
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class {};
}

import { NextResponse } from "next/server";
import { groqJson } from "@/lib/groq";

// Fallback schema for Groq response
const fallbackResponse = {
  educationLevel: "Bachelor",
  major: "Computer Science",
  interests: "Software Development",
  preferredRoles: "Software Engineer",
  experienceLevel: "Entry Level",
  skills: ["JavaScript", "React"]
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    let extractedText = "";

    if (file) {
      // Dynamically import pdf-parse to avoid bundling issues
      const { default: pdfParse } = await import('pdf-parse');
      if (file.type === "application/pdf") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text;
      } else {
        extractedText = await file.text();
      }
    }

    const githubUsername = formData.get("githubUsername") as string | null;
    if (!extractedText && !githubUsername) {
      return NextResponse.json({ error: "No file or GitHub username provided." }, { status: 400 });
    }

    if (githubUsername && !extractedText) {
      // Fetch GitHub Repos
      const res = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=10`);
      if (res.ok) {
        const repos = await res.json();
        const repoData = repos.map((r: any) => `${r.name}: ${r.description || ""} (Language: ${r.language || "Unknown"})`).join("\n");
        extractedText = `User's GitHub Repositories:\n${repoData}`;
      } else {
        return NextResponse.json({ error: "Failed to fetch GitHub profile." }, { status: 400 });
      }
    }

    const prompt = `
      You are an expert technical recruiter and resume parser.
      Analyze the following text (which is either a resume or a list of GitHub repositories) and extract the user's professional profile into a strict JSON format.
      
      Text to analyze:
      """
      ${extractedText.slice(0, 5000)}
      """
      
      Extract the following fields:
      - educationLevel: e.g., High School, Bachelor, Master, PhD, Bootcamp (Guess based on context, default to Bachelor if unknown)
      - major: e.g., Computer Science, Data Science (Guess based on context, default to General if unknown)
      - interests: A comma-separated list of technical interests (e.g., AI, Web Development)
      - preferredRoles: A comma-separated list of roles they seem fit for (e.g., Frontend Developer, Data Analyst)
      - experienceLevel: "Entry Level", "Mid Level", or "Senior Level" (Guess based on years of experience or complexity of projects)
      - skills: An array of strings representing specific technical skills (e.g., ["React", "Python", "Docker"])
      
      Return strictly a JSON object. Do not wrap in markdown tags or include any explanatory text.
    `;

    const extractedProfile = await groqJson(prompt, fallbackResponse);
    return NextResponse.json(extractedProfile);
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: "Failed to extract profile." }, { status: 500 });
  }
}
