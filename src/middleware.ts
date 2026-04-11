import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

// Lindungi folder dashboard secara otomatis
export const config = {
  matcher: ["/dashboard/:path*"],
}
