"use client";

import { useState } from "react";
import { useGameState } from "@/lib/useGameState";
import { MODES } from "@/lib/modes";
import type { Mode } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { HomeHero } from "@/components/HomeHero";
import { DailyStreakCard } from "@/components/DailyStreakCard";
import { ModesGrid } from "@/components/ModesGrid";
import { SkillTracks } from "@/components/SkillTracks";
import { Leaderboard } from "@/components/Leaderboard";
import { GameStage } from "@/components/GameStage";
import { Paywall } from "@/components/Paywall";
import { Toast, type ToastMessage } from "@/components/Toast";

export default function Home() {
  const { state, hydrated, levelProgress, actions, user } = useGameState();
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [paywall, setPaywall] = useState<{
    open: boolean;
    reason: "lock" | "lives" | "premium";
    mode?: Mode | null;
  }>({ open: false, reason: "lock" });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function handlePlay(mode: Mode) {
    if (state.level < mode.minLevel) {
      setPaywall({ open: true, reason: "lock", mode });
      return;
    }
    if (mode.premium && !state.premium) {
      setPaywall({ open: true, reason: "premium", mode });
      return;
    }
    if (state.lives <= 0 && !state.premium) {
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

        <div id="modes-section" className="flex items-end justify-between gap-3 mt-9 mb-3.5">
          <div>
            <h2 className="text-[clamp(20px,2.4vw,26px)] font-semibold tracking-tight">Today&apos;s modes</h2>
            <p className="text-muted text-[13px] mt-1">
              Each session is 1–3 minutes. Earn XP, build streaks, climb the leaderboard.
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
    </>
  );
}
