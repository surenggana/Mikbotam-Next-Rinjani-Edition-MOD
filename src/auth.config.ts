import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Providers are defined in auth.ts (Node.js)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
