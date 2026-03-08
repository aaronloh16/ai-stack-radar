"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Github, Radio } from "lucide-react";

const NAV_LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/generate", label: "Generate Stack" },
  { href: "/analyze", label: "Stack Health" },
];

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(6,6,14,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
      className="px-6 py-4"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="relative w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent-cyan-dim)", border: "1px solid var(--accent-cyan)", borderColor: "rgba(34,211,238,0.3)" }}
          >
            <Radio
              className="w-3.5 h-3.5 transition-transform group-hover:rotate-12"
              style={{ color: "var(--accent-cyan)" }}
            />
            <span
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "var(--accent-cyan-dim)" }}
            />
          </div>
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif", letterSpacing: "-0.02em" }}
          >
            AI Stack Radar
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-sm rounded-lg transition-all"
              style={{
                color: isActive(link.href) ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive(link.href) ? "var(--border-subtle)" : "transparent",
                fontWeight: isActive(link.href) ? 600 : 400,
              }}
            >
              {isActive(link.href) && (
                <span
                  className="absolute inset-x-4 bottom-1 h-px"
                  style={{ background: "var(--accent-cyan)" }}
                />
              )}
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/aaronloh16/ai-stack-radar"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 p-2 rounded-lg transition-all"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
            }}
          >
            <Github className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="sm:hidden mt-4 pb-4 space-y-1"
          style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 text-sm rounded-lg transition-colors"
              style={{
                color: isActive(link.href) ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive(link.href) ? "var(--border-subtle)" : "transparent",
                fontWeight: isActive(link.href) ? 600 : 400,
              }}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/aaronloh16/ai-stack-radar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
      )}
    </nav>
  );
}
