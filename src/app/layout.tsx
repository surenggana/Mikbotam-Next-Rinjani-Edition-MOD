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
  description: "Modern Evolution of MikroTik Bot Management using Next.js 16. Support RouterOS 7, Multi-Router, and Advanced Bandwidth Management.",
  keywords: ["mikrotik", "bot telegram", "hotspot manager", "pppoe manager", "mikbotam", "rinjani edition"],
  authors: [{ name: "Sanrian Surenggana" }],
  openGraph: {
    title: "Mikbotam Next - Rinjani Edition",
    description: "Kelola jaringan MikroTik Hotspot & PPP secara modern melalui Dashboard Web dan Bot Telegram.",
    url: "https://mikbotam.angelicadigital.id",
    siteName: "Mikbotam Next",
    images: [
      {
        url: "/logo-outline.svg",
        width: 800,
        height: 600,
        alt: "Mikbotam Next Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mikbotam Next - Rinjani Edition",
    description: "Modern MikroTik Bot Management System",
    images: ["/logo-outline.svg"],
  },
  icons: {
    icon: [
      { url: "/logo-outline.svg", type: "image/svg+xml" },
    ],
    apple: "/logo-outline.svg",
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
