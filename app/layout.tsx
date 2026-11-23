import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOVA — Voice Assistant",
  description: "A voice-first AI assistant that listens, thinks and answers out loud.",
};

export const viewport: Viewport = {
  themeColor: "#04070c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${geistSans.variable} ${geistMono.variable} h-full bg-void antialiased`}
    >
      <body className="min-h-full bg-void text-ink">{children}</body>
    </html>
  );
}
