"use client";

import { useEffect, useState } from "react";
import { useGameState } from "@/lib/useGameState";
import { MODES } from "@/lib/modes";
import { tierAllowsBoss } from "@/lib/tiers";
import { careerTitle, isPromotion } from "@/lib/career";
import type { Mode } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { HomeHero } from "@/components/HomeHero";
import { DailyStreakCard } from "@/components/DailyStreakCard";
import { DailyScenarioCard } from "@/components/DailyScenarioCard";
import { CareerJourney } from "@/components/CareerJourney";
import { ModesGrid } from "@/components/ModesGrid";
import { SkillTracks } from "@/components/SkillTracks";
import { Leaderboard } from "@/components/Leaderboard";
import { GameStage } from "@/components/GameStage";
import { Paywall } from "@/components/Paywall";
import { Toast, type ToastMessage } from "@/components/Toast";
import { xpForLevel, totalXpToReach } from "@/lib/progression";

export default function Home() {
  const { state, hydrated, levelProgress, actions, user, lastLevelUp } = useGameState();
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [promotion, setPromotion] = useState<{ from: number; to: number } | null>(null);
  const [paywall, setPaywall] = useState<{
    open: boolean;
    reason: "lock" | "lives" | "premium";
    mode?: Mode | null;
  }>({ open: false, reason: "lock" });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function handlePlay(mode: Mode) {
    // Free users must grind XP to unlock modes; paid users skip the level gate.
    if (state.tier === "free" && state.level < mode.minLevel) {
      setPaywall({ open: true, reason: "lock", mode });
      return;
    }
    // Boss Battle (mode.premium) requires Extended tier or higher.
    if (mode.premium && !tierAllowsBoss(state.tier)) {
      setPaywall({ open: true, reason: "premium", mode });
      return;
    }
    // Lives gate only applies to free tier; paid tiers play unlimited.
    if (state.lives <= 0 && state.tier === "free") {
      setPaywall({ open: true, reason: "lives" });
      return;
    }
    actions.bumpStreak();
    setActiveMode(mode);
  }

  function quickPlay() {
    handlePlay(MODES[0]); // Quiz Blitz
  }

  function browseModes() {
    document.getElementById("modes-section")?.scrollIntoView({ behavior: "smooth" });
  }

  function fireToast(text: string, level?: number) {
    setToast({ id: Date.now(), text, level });
  }

  // Watch for level-ups → fire confetti + show promotion banner if it's a career milestone
  useEffect(() => {
    if (!lastLevelUp) return;
    const { from, to } = lastLevelUp;
    fireToast(`Level ${to} reached`, to);
    // Confetti — dynamically imported to avoid SSR issues
    import("canvas-confetti")
      .then(({ default: confetti }) => {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => confetti({ particleCount: 50, spread: 100, angle: 60, origin: { x: 0, y: 0.7 } }), 250);
        setTimeout(() => confetti({ particleCount: 50, spread: 100, angle: 120, origin: { x: 1, y: 0.7 } }), 400);
      })
      .catch(() => {
        /* lib not installed — silently no-op */
      });
    if (isPromotion(from, to)) {
      setPromotion({ from, to });
    }
  }, [lastLevelUp]);

  // Avoid SSR/CSR mismatch
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-bg" />
    );
  }

  return (
    <>
      <AppHeader state={state} levelProgress={levelProgress} />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-8 pb-20 pt-4">
        <section className="my-7 grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <HomeHero onQuickPlay={quickPlay} onBrowse={browseModes} />
          <DailyStreakCard streak={state.streak} />
        </section>

        {/* Daily scenario — featured at the top */}
        <section className="mb-7">
          <DailyScenarioCard onPlay={handlePlay} />
        </section>

        {/* Your Journey strip */}
        <section className="mb-7">
          <CareerJourney
            level={state.level}
            xpInLevel={state.xp - totalXpToReach(state.level)}
            xpNeededForLevel={xpForLevel(state.level)}
          />
        </section>

        <div id="modes-section" className="flex items-end justify-between gap-3 mt-9 mb-3.5">
          <div>
            <h2 className="text-[clamp(20px,2.4vw,26px)] font-semibold tracking-tight">Pick your mode</h2>
            <p className="text-muted text-[13px] mt-1">
              Six different ways to play. Find your favourite.
            </p>
          </div>
          <span className="text-muted text-[13px] hidden sm:inline">
            Refill in <b className="text-ink">28:14</b>
          </span>
        </div>

        <ModesGrid state={state} onPlay={handlePlay} />

        <div className="flex items-end justify-between gap-3 mt-9 mb-3.5">
          <h2 className="text-[clamp(20px,2.4vw,26px)] font-semibold tracking-tight">Your progress</h2>
          <span className="text-muted text-[13px]">5 skill tracks</span>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
          <SkillTracks state={state} />
          <Leaderboard state={state} />
        </div>

        <p className="text-muted text-[12px] text-center pt-8 leading-relaxed">
          Educational tool only — not legal advice. Content references the Employment Act 1955 (as amended 2022),
          Sabah Labour Ordinance (Cap. 67), and Sarawak Labour Ordinance (Cap. 76). Always consult Jabatan Tenaga Kerja
          or qualified counsel for binding interpretation.
        </p>
      </main>

      <Toast message={toast} />

      <GameStage
        mode={activeMode}
        premium={state.premium}
        level={state.level}
        xp={state.xp}
        onClose={() => setActiveMode(null)}
        onAwardXp={actions.awardXp}
        onLoseLife={actions.loseLife}
        onAddBadge={actions.addBadge}
        onToast={fireToast}
      />

      <Paywall
        open={paywall.open}
        reason={paywall.reason}
        mode={paywall.mode}
        level={state.level}
        user={user}
        onClose={() => setPaywall({ ...paywall, open: false })}
        onSignInPrompt={() => {
          fireToast("Click 'Sign in' in the top right first");
        }}
        onWaitForLives={() => {
          actions.refillLives();
          fireToast("Lives refilled");
          setPaywall({ ...paywall, open: false });
        }}
      />

      {/* Promotion overlay — shown when user crosses an HR career tier */}
      {promotion && (
        <div
          className="fixed inset-0 bg-black/55 z-[70] flex items-center justify-center p-6 animate-[fade_0.25s]"
          onClick={() => setPromotion(null)}
        >
          <div
            className="bg-bg rounded-2xl shadow-2xl max-w-[440px] w-full p-8 text-center relative animate-[promote_0.5s_cubic-bezier(.2,.8,.2,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[12px] uppercase tracking-wider text-muted mb-2">Promotion</div>
            <div className="text-[44px] mb-2">🎉</div>
            <h2 className="text-3xl font-bold tracking-tight">
              You&apos;re now a<br />
              <span className="text-accent">{careerTitle(promotion.to)}</span>
            </h2>
            <p className="text-muted mt-3 text-[14px]">
              Reached Level {promotion.to}. Keep going — your next title is waiting.
            </p>
            <button
              onClick={() => setPromotion(null)}
              className="mt-6 px-6 py-3 rounded-[10px] bg-accent text-white font-semibold text-sm hover:-translate-y-px transition-transform"
            >
              Back to work
            </button>
          </div>
          <style jsx>{`
            @keyframes fade {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes promote {
              0% { transform: scale(0.8) translateY(20px); opacity: 0; }
              60% { transform: scale(1.04) translateY(0); opacity: 1; }
              100% { transform: scale(1) translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
