import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || !user.profile) redirect("/auth/signin");
  const body = await req.json();
  if (!body.entityType || !body.entityId || typeof body.rating !== "number") {
    return Response.json({ error: "Invalid feedback payload" }, { status: 400 });
  }
  const feedback = await prisma.recommendationFeedback.create({
    data: {
      profileId: user.profile.id,
      entityType: String(body.entityType),
      entityId: String(body.entityId),
      rating: body.rating,
      note: body.note ? String(body.note) : null
    }
  });
  return Response.json({ feedback });
}
