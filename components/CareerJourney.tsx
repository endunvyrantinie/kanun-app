"use client";

import { CAREER_TIERS, careerTitle, nextCareerTier } from "@/lib/career";

interface Props {
  level: number;
  xpInLevel: number;
  xpNeededForLevel: number;
}

// Emoji per tier — visual progression cue
const TIER_EMOJI = ["🌱", "📋", "💼", "📊", "🎯", "🏆", "👔", "🏛️"];

export function CareerJourney({ level, xpInLevel, xpNeededForLevel }: Props) {
  const next = nextCareerTier(level);
  const currentIndex = CAREER_TIERS.findIndex((t, i) => {
    const nextT = CAREER_TIERS[i + 1];
    return t.minLevel <= level && (!nextT || level < nextT.minLevel);
  });

  return (
    <div className="bg-surface border border-line rounded-[20px] p-6 sm:p-7">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-[12px] uppercase tracking-wider text-muted mb-1">Your journey</div>
          <h3 className="text-xl font-bold tracking-tight">
            You&apos;re a <span className="text-accent">{careerTitle(level)}</span>
          </h3>
        </div>
        {next && (
          <div className="text-right">
            <div className="text-[12px] text-muted">Next: {next.short}</div>
            <div className="text-[13px] font-semibold tabular-nums">
              Lv {level} → Lv {next.minLevel}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto -mx-2 px-2 pb-1">
        <div className="flex items-center gap-1 min-w-max">
          {CAREER_TIERS.map((t, i) => {
            const isCurrent = i === currentIndex;
            const isPast = i < currentIndex;
            const isNext = i === currentIndex + 1;
            const isFuture = i > currentIndex + 1;
            return (
              <div key={t.minLevel} className="flex items-center">
                <div className="flex flex-col items-center min-w-[78px]">
                  <div
                    className={`w-12 h-12 rounded-full grid place-items-center text-2xl border-2 transition-all ${
                      isCurrent
                        ? "bg-accent text-white border-accent shadow-[0_0_0_4px_rgba(124,58,237,0.18)] scale-110"
                        : isPast
                        ? "bg-accent-soft border-accent-soft"
                        : isNext
                        ? "bg-surface border-line-2 border-dashed"
                        : "bg-surface-2 border-surface-2 grayscale opacity-50"
                    }`}
                  >
                    {isPast ? (
                      <span className="text-accent text-base">✓</span>
                    ) : (
                      <span aria-hidden>{TIER_EMOJI[i] ?? "•"}</span>
                    )}
                  </div>
                  <div
                    className={`text-[11px] mt-1.5 font-semibold text-center leading-tight ${
                      isCurrent ? "text-accent" : isFuture ? "text-muted" : "text-ink-2"
                    }`}
                  >
                    {t.short}
                  </div>
                  <div className="text-[10px] text-muted mt-0.5 tabular-nums">Lv {t.minLevel}</div>
                </div>
                {i < CAREER_TIERS.length - 1 && (
                  <div
                    className={`h-[2px] w-8 sm:w-10 rounded-full mx-0.5 ${
                      i < currentIndex ? "bg-accent" : "bg-line"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress within current level */}
      {next && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-[12px] text-muted mb-1.5">
            <span>Progress to next promotion</span>
            <span className="tabular-nums">
              {xpInLevel} / {xpNeededForLevel} XP
            </span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-deep rounded-full transition-[width] duration-700"
              style={{ width: `${Math.min(100, (xpInLevel / xpNeededForLevel) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
