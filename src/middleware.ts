export { auth as middleware } from "@/auth"

// Lindungi folder dashboard secara otomatis
export const config = {
  matcher: ["/dashboard/:path*"],
}
