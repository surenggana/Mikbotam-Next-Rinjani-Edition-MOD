import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import SessionProvider from "@/components/session-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://mikbotam.angelicadigital.id"),
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
        url: "/logo-mark.svg",
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
    images: ["/logo-mark.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo-mark.svg",
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
      className="antialiased"
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
