"use client";

import { useMemo } from "react";
import { useQuestions } from "@/lib/useQuestions";
import { lawLabel } from "@/lib/progression";
import type { Mode } from "@/lib/types";

interface Props {
  onPlay: (mode: Mode) => void;
}

// Pick one question deterministically per calendar day so the daily scenario
// is the same for everyone within the same 24h window.
function todayHash(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

const SCENARIO_MODE: Mode = {
  id: "scenario",
  name: "Today's Scenario",
  tag: "Quick HR case",
  desc: "Today's case",
  minLevel: 1,
  iconPath: "",
  iconEmoji: "☀️",
};

export function DailyScenarioCard({ onPlay }: Props) {
  const { questions } = useQuestions();

  const todays = useMemo(() => {
    if (!questions.length) return null;
    // Prefer scenarios; fallback to any question
    const pool = questions.filter((q) => q.type === "scenario");
    const arr = pool.length > 0 ? pool : questions;
    const idx = todayHash() % arr.length;
    return arr[idx];
  }, [questions]);

  if (!todays) return null;

  const teaser =
    todays.setup ??
    todays.text ??
    "A workplace situation. Your call.";

  const dateLabel = new Date().toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <button
      type="button"
      onClick={() => onPlay(SCENARIO_MODE)}
      className="group w-full text-left bg-gradient-to-br from-accent to-accent-deep text-white rounded-[20px] p-6 sm:p-7 relative overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="absolute -top-10 -right-10 w-[180px] h-[180px] bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-[160px] h-[160px] bg-white/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 text-white/80 text-[12px] uppercase tracking-wider mb-2">
          <span aria-hidden className="text-base">☀️</span>
          Today&apos;s scenario · {dateLabel}
        </div>
        <h3 className="text-[clamp(20px,2.6vw,26px)] font-bold tracking-tight leading-tight mt-1">
          {teaser.length > 140 ? teaser.slice(0, 140).trim() + "…" : teaser}
        </h3>
        <div className="flex items-center justify-between mt-5 flex-wrap gap-2">
          <div className="flex gap-2">
            <span className="bg-white/15 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur">
              {lawLabel(todays.law)}
            </span>
            <span className="bg-white/15 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur capitalize">
              {todays.topic}
            </span>
          </div>
          <span className="bg-white text-accent px-4 py-2 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
            Try today&apos;s case →
          </span>
        </div>
      </div>
    </button>
  );
}
