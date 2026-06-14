import fs from "fs";
import path from "path";

export async function GET() {
  const file = path.join(process.cwd(), "data", "processed", "unmatched-role-mappings.json");
  if (!fs.existsSync(file)) return Response.json({ error: "No unmatched file found" }, { status: 404 });
  const body = fs.readFileSync(file, "utf8");
  return new Response(body, { headers: { "Content-Type": "application/json" } });
}
