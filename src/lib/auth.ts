import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth";

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" as const },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await compare(password, user.password);
        return ok ? { id: user.id, email: user.email, name: user.name, role: user.role } as any : null;
      }
    })
  ],
  pages: { signIn: "/auth/signin" }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions as any);
