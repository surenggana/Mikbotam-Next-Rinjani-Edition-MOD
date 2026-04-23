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
      const isLoginPage = nextUrl.pathname === "/login";
      const isApiRoute = nextUrl.pathname.startsWith("/api");
      const isPublicAsset = nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.includes(".");

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (isApiRoute || isPublicAsset) return true;

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
