"use client";

import type { GameState } from "@/lib/types";

interface Props {
  state: GameState;
}

const SEED = [
  { name: "Aisyah K.", meta: "KL · Level 14", xp: 4820 },
  { name: "Ravi P.", meta: "Penang · Level 13", xp: 4490 },
  { name: "Mei Ling", meta: "Johor · Level 12", xp: 4060 },
  { name: "Hafiz S.", meta: "Kuching · Level 11", xp: 3680 },
  { name: "Jacqueline T.", meta: "KK · Level 11", xp: 3510 },
  { name: "Daniel L.", meta: "Shah Alam · Level 9", xp: 2870 },
  { name: "Nur F.", meta: "Ipoh · Level 8", xp: 2440 },
  { name: "Wei Han", meta: "Melaka · Level 7", xp: 2090 },
  { name: "Zarith A.", meta: "PJ · Level 6", xp: 1820 },
];

export function Leaderboard({ state }: Props) {
  const rows = [
    ...SEED,
    { name: "You", meta: `KL · Level ${state.level}`, xp: state.xp, you: true as const },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="bg-surface border border-line rounded-[14px] p-6">
      <h3 className="text-[17px] font-semibold mb-3.5">This week&apos;s leaderboard</h3>
      <p className="text-[13px] text-muted mb-3.5">
        Top 10 across all jurisdictions. Resets Monday 00:00 MYT.
      </p>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => {
          const you = "you" in row && row.you;
          const rankColor =
            i === 0 ? "text-gold" : i === 1 ? "text-muted" : i === 2 ? "text-[#B45309]" : "text-muted";
          return (
            <div
              key={row.name}
              className={`grid grid-cols-[28px_1fr_auto] gap-3 items-center p-2.5 rounded-[10px] text-[14px] ${
                you ? "bg-accent-soft border border-[#FFD8C2]" : "bg-surface-2"
              }`}
            >
              <div className={`font-bold text-center tabular-nums ${rankColor}`}>{i + 1}</div>
              <div>
                <div className="font-medium">{row.name}</div>
                <div className="text-muted text-[12px]">{row.meta}</div>
              </div>
              <div className="font-semibold tabular-nums">{row.xp.toLocaleString()} XP</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
