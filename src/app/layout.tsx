import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import SessionProvider from "@/components/session-provider";

const geistSans = Geist({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: "Mikbotam Next - Rinjani Edition",
  description: "Modern Evolution of MikroTik Bot Management",
  icons: {
    icon: [
      { url: "/logo-next.svg", type: "image/svg+xml" },
    ],
    apple: "/logo-next.svg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-background font-sans">
        <SessionProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </SessionProvider>
      </body>
    </html>
  );
}
