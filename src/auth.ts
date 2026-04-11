import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

// Skema validasi input (Security Best Practice)
const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(5),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        // 1. Validasi format input dengan Zod (Cegah Malformed Data)
        const parsedCredentials = loginSchema.safeParse(credentials);
        if (!parsedCredentials.success) return null;

        const { username, password } = parsedCredentials.data;

        // 2. Cari user di database
        const user = await prisma.admin.findFirst({
          where: { u_user: username },
        });

        if (!user) return null;

        // 3. Verifikasi Password (Dukungan Transisi Plain-text ke Hash)
        let isPasswordCorrect = false;

        // Cek apakah password di DB sudah berupa hash BCrypt (biasanya diawali $2b$ atau $2a$)
        const isHashed = user.u_pass.startsWith("$2b$") || user.u_pass.startsWith("$2a$");

        if (isHashed) {
          // Jika sudah hash, verifikasi dengan bcrypt.compare
          isPasswordCorrect = await bcrypt.compare(password, user.u_pass);
        } else {
          // Jika masih plain-text (dari PHP lama), bandingkan langsung
          isPasswordCorrect = password === user.u_pass;

          // SECURITY UPGRADE: Jika benar, otomatis ubah ke hash agar aman selamanya
          if (isPasswordCorrect) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.admin.update({
              where: { u_id: user.u_id },
              data: { u_pass: hashedPassword },
            });
            console.log(`[Security] Password user ${username} telah ditingkatkan ke BCrypt Hash.`);
          }
        }

        if (isPasswordCorrect) {
          return {
            id: user.u_id.toString(),
            name: user.u_user,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt", // Menggunakan Stateless JWT (Lebih aman dari Session hijacking)
    maxAge: 30 * 24 * 60 * 60, // Sesi berlaku 30 hari
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Memastikan dashboard hanya bisa diakses user yang sudah login di level Middleware
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect ke login
      }
      return true;
    },
  },
});
