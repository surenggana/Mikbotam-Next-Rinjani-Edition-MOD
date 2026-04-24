import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { authConfig } from "./auth.config";

// Skema validasi input
const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(5),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);
        if (!parsedCredentials.success) return null;

        const { username, password } = parsedCredentials.data;

        const user = await prisma.admin.findFirst({
          where: { u_user: username },
        });

        if (!user) return null;

        let isPasswordCorrect = false;
        const isHashed = user.u_pass.startsWith("$2b$") || user.u_pass.startsWith("$2a$");

        if (isHashed) {
          isPasswordCorrect = await bcrypt.compare(password, user.u_pass);
        } else {
          isPasswordCorrect = password === user.u_pass;
          if (isPasswordCorrect) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.admin.update({
              where: { u_id: user.u_id },
              data: { u_pass: hashedPassword },
            });
          }
        }

        if (isPasswordCorrect) {
          return {
            id: user.u_id.toString(),
            name: user.u_user,
            role: user.role, // Tambahkan role
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
