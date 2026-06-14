import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groqJson } from "@/lib/groq";
import pdfParse from "pdf-parse";

const fallbackResponse = {
  score: 50,
  missingKeywords: ["React", "TypeScript"],
  bulletPoints: [
    {
      original: "Worked on software developer tasks.",
      suggestion: "Developed responsive frontend components using React and TypeScript, improving user engagement by 15%.",
      explanation: "Added specific technologies (React, TypeScript) and measurable impact."
    }
  ],
  tailoredText: "Tailored Resume Content..."
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const targetRoleId = formData.get("targetRoleId") as string;
    
    if (!targetRoleId) {
      return NextResponse.json({ error: "Missing target role ID" }, { status: 400 });
    }

    // Get Target Role requirements
    const role = await prisma.careerRole.findUnique({
      where: { id: targetRoleId },
      include: {
        skillRequirements: { include: { skill: true } },
        technologies: { include: { technology: true } }
      }
    });

    if (!role) {
      return NextResponse.json({ error: "Career role not found" }, { status: 404 });
    }

    // Parse resume
    const file = formData.get("file") as File | null;
    let resumeText = formData.get("resumeText") as string || "";

    if (file) {
      if (file.type === "application/pdf") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = await pdfParse(buffer);
        resumeText = parsed.text;
      } else {
        resumeText = await file.text();
      }
    }

    if (!resumeText) {
      return NextResponse.json({ error: "Missing resume content" }, { status: 400 });
    }

    // Compile role skills and tech as keywords
    const keywords = [
      ...role.skillRequirements.map(sr => sr.skill.name),
      ...role.technologies.map(t => t.technology.name)
    ];

    const prompt = `
      You are an expert resume optimization engine.
      Compare the user's Resume Text against the target Career Role requirements.
      
      Target Role: ${role.name}
      Role Description: ${role.description}
      Keywords to match: ${keywords.join(", ")}
      
      User Resume Text:
      """
      ${resumeText}
      """
      
      Tasks:
      1. Calculate an alignment score (0 to 100%) indicating how well the resume matches the target role.
      2. Identify missing keywords/skills that are important for the target role but absent or weak in the resume.
      3. Identify up to 5 bullet points from the resume that can be significantly improved, and provide an optimized, tailored version of each bullet point that highlights their relevance to the target role's skills.
      4. Output the full tailored resume text.
      
      Return strictly a JSON object matching this structure:
      {
        "score": number,
        "missingKeywords": string[],
        "bulletPoints": [
          {
            "original": string,
            "suggestion": string,
            "explanation": string
          }
        ],
        "tailoredText": string
      }
      
      Do not include markdown wrappers or other text outside the JSON.
    `;

    const result = await groqJson(prompt, fallbackResponse);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Resume tailoring error:", error);
    return NextResponse.json({ error: "Failed to tailor resume" }, { status: 500 });
  }
}
