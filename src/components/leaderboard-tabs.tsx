"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, BookOpen } from "lucide-react";

type View = "momentum" | "essentials";

export function LeaderboardTabs({ activeView }: { activeView: View }) {
  const router = useRouter();

  function switchView(view: View) {
    if (view === activeView) return;
    router.push(
      view === "momentum" ? "/leaderboard?view=momentum" : "/leaderboard"
    );
  }

  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => switchView("momentum")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          activeView === "momentum"
            ? "bg-white text-zinc-900"
            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <TrendingUp className="w-4 h-4" />
        Momentum
      </button>
      <button
        onClick={() => switchView("essentials")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          activeView === "essentials"
            ? "bg-white text-zinc-900"
            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <BookOpen className="w-4 h-4" />
        Developer Essentials
      </button>
    </div>
  );
}
