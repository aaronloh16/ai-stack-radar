import type { Metadata } from "next";
import { Syne, JetBrains_Mono } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Stack Radar",
  description:
    "AI dev tool leaderboard + architecture generator backed by live sentiment data",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${syne.variable} ${jetbrainsMono.variable} min-h-screen`}
        style={{ background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
      >
        <div className="noise-overlay" />
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
