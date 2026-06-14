type GroqResponse = { content: string };

export async function groqJson<T>(prompt: string, fallback: T): Promise<T> {
  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";
  if (!key) return fallback;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });
  if (!res.ok) return fallback;
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(content) as T; } catch { return fallback; }
}

