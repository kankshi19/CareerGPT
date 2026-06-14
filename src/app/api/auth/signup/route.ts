import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.email || !body.password) return Response.json({ error: "Missing email or password" }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return Response.json({ error: "User already exists" }, { status: 409 });
  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name ?? body.email.split("@")[0],
      password: await hash(body.password, 10)
    }
  });
  return Response.json({ id: user.id, email: user.email });
}
