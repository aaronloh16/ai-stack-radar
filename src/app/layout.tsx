import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Stack Radar",
  description:
    "AI dev tool leaderboard + architecture generator backed by live sentiment data",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        <nav className="border-b border-zinc-800 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              AI Stack Radar
            </Link>
            <div className="flex gap-6 text-sm text-zinc-400">
              <Link href="/leaderboard" className="hover:text-zinc-100 transition-colors">
                Leaderboard
              </Link>
              <Link href="/generate" className="hover:text-zinc-100 transition-colors">
                Generate Stack
              </Link>
              <a
                href="https://github.com/yourusername/ai-stack-radar"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-100 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
