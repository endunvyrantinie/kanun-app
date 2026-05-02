"use client";

import type { GameState } from "@/lib/types";

interface Props {
  state: GameState;
}

const TRACKS: Array<{
  key: keyof GameState["skill"];
  label: string;
  color: string;
}> = [
  { key: "recruitment", label: "Recruitment & Hiring", color: "bg-accent" },
  { key: "termination", label: "Termination & Dismissal", color: "bg-[#2D5BFF]" },
  { key: "compliance", label: "Compliance & OSH", color: "bg-good" },
  { key: "leave", label: "Leave & Benefits", color: "bg-[#8B5CF6]" },
  { key: "wages", label: "Wages & Working Hours", color: "bg-gold" },
];

const BADGES = [
  { k: "first", icon: "★", name: "First win" },
  { k: "streak7", icon: "🔥", name: "7-day streak" },
  { k: "rising", icon: "▲", name: "Level 5" },
  { k: "senior", icon: "◆", name: "Level 10" },
  { k: "perfect", icon: "✓", name: "Perfect Blitz" },
  { k: "boss1", icon: "♛", name: "Boss slayer" },
];

export function SkillTracks({ state }: Props) {
  return (
    <div className="bg-surface border border-line rounded-[14px] p-6">
      <h3 className="text-[17px] font-semibold mb-3.5">Skill tracks</h3>
      <p className="text-[13px] text-muted mb-4">
        Mastery in each track unlocks specialty Boss Battles and a printable certificate at 100%.
      </p>

      {TRACKS.map((t) => {
        const v = Math.round(state.skill[t.key]);
        return (
          <div key={t.key} className="mb-3.5 last:mb-0">
            <div className="flex justify-between text-[13px] mb-1.5 text-ink-2">
              <span>{t.label}</span>
              <span className="text-muted tabular-nums">{v}%</span>
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${t.color} rounded-full transition-[width] duration-700`}
                style={{ width: `${v}%` }}
              />
            </div>
          </div>
        );
      })}

      <h3 className="text-[17px] font-semibold mt-6 mb-2.5">Badges</h3>
      <div className="flex gap-2 flex-wrap">
        {BADGES.map((b) => {
          const earned = state.badges.includes(b.k);
          return (
            <div
              key={b.k}
              title={(earned ? "" : "Locked — ") + b.name}
              className={`w-14 h-14 rounded-[12px] grid place-items-center text-2xl border ${
                earned
                  ? "bg-accent-soft border-[#FFD8C2]"
                  : "bg-surface-2 border-line opacity-50"
              }`}
            >
              {earned ? b.icon : "·"}
            </div>
          );
        })}
      </div>
    </div>
  );
}
