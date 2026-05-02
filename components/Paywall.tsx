"use client";

import { useEffect, useState } from "react";
import type { Mode } from "@/lib/types";

interface Props {
  open: boolean;
  reason: "lock" | "lives" | "premium";
  mode?: Mode | null;
  level: number;
  onClose: () => void;
  onUnlock: () => void;
  onWaitForLives?: () => void;
}

export function Paywall({ open, reason, mode, level, onClose, onUnlock, onWaitForLives }: Props) {
  const [plan, setPlan] = useState<"monthly" | "yearly" | "team">("yearly");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const need = mode?.minLevel ?? 5;
  const pct = Math.min(100, Math.round((level / need) * 100));
  const isLives = reason === "lives";

  return (
    <div className="fixed inset-0 bg-black/55 z-[55] flex items-stretch justify-center sm:p-6">
      <div className="bg-bg w-full max-w-[720px] h-full sm:h-auto sm:max-h-[calc(100vh-48px)] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3.5 px-4.5 py-3.5 border-b border-line bg-surface" style={{ paddingLeft: "18px", paddingRight: "18px" }}>
          <div className="font-semibold text-[15px] flex items-center gap-2.5">
            {isLives ? "Out of lives" : "Unlock Premium"}
            <span className="bg-accent-soft text-accent px-2 py-0.5 rounded-full text-[11px] font-semibold">
              {isLives ? "Refill" : `Lv ${need}+`}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4.5 sm:px-7 py-5" style={{ paddingLeft: "18px", paddingRight: "18px" }}>
          <div className="bg-ink text-white rounded-[12px] p-4.5 flex items-center gap-3.5 mb-4.5 relative overflow-hidden">
            <div
              className="absolute -top-10 -right-15 w-[200px] h-[200px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,90,31,.45), transparent 70%)",
              }}
            />
            <div className="w-12 h-12 bg-white/[0.08] rounded-[12px] grid place-items-center flex-shrink-0 relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
                {isLives ? (
                  <path d="M12 21s-7.5-4.6-9.6-10.1C1.1 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.9C13.2 5.1 14.8 4 16.8 4c3.6 0 6.1 3.6 4.8 6.9C19.5 16.4 12 21 12 21z" />
                ) : (
                  <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3z" />
                )}
              </svg>
            </div>
            <div className="relative">
              <h2 className="text-[20px] font-semibold text-white tracking-tight">
                {isLives ? "You're out of lives" : `${mode?.name ?? "Premium"} is locked at Level ${need}`}
              </h2>
              <p className="text-white/75 mt-1 text-[13px]">
                {isLives
                  ? "Wait 28 minutes for a free refill — or go premium for unlimited play."
                  : `You're ${pct}% of the way there. Premium unlocks all advanced levels and unlimited play instantly.`}
              </p>
            </div>
          </div>

          {!isLives && (
            <div className="bg-surface border border-line rounded-[12px] p-4 mb-3.5">
              <div className="flex justify-between items-center mb-2">
                <b className="text-[14px]">Your progress to Lv {need}</b>
                <span className="text-accent text-[13px] font-semibold">{pct}%</span>
              </div>
              <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-[width] duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3.5">
            <PlanCard
              selected={plan === "monthly"}
              onClick={() => setPlan("monthly")}
              name="Monthly"
              price="RM19"
              suffix="/mo"
              line="Cancel anytime"
            />
            <PlanCard
              selected={plan === "yearly"}
              onClick={() => setPlan("yearly")}
              name="Yearly"
              price="RM119"
              suffix="/yr"
              line="Just RM9.92/mo"
              badge="SAVE 47%"
            />
            <PlanCard
              selected={plan === "team"}
              onClick={() => setPlan("team")}
              name="Team · 5 seats"
              price="RM399"
              suffix="/yr"
              line="For HR teams"
            />
          </div>

          <ul className="flex flex-col gap-2 mt-1">
            {[
              "Unlimited lives — never wait to play",
              "All levels & jurisdictions (EA1955, Sabah, Sarawak)",
              "Boss Battles and weekly Ranked challenges",
              "Streak protection — one missed day won't reset you",
              "HR Compliance Certificate on track completion",
              "Personal analytics dashboard",
            ].map((line) => (
              <li key={line} className="pl-6 relative text-[14px] text-ink-2">
                <span className="absolute left-0 top-1.5 w-4 h-4 bg-good rounded-full grid place-items-center text-white text-[10px]">✓</span>
                {line}
              </li>
            ))}
          </ul>

          <p className="text-muted text-center mt-3.5 text-[12px]">
            Join 4,200+ HR practitioners across Malaysia · 30-day money-back
          </p>
        </div>

        <div className="border-t border-line bg-surface px-4.5 py-3.5 flex justify-between gap-2.5 items-center" style={{ paddingLeft: "18px", paddingRight: "18px" }}>
          <button onClick={isLives && onWaitForLives ? onWaitForLives : onClose} className="px-4 py-3 rounded-[10px] bg-transparent border border-line-2 text-ink font-semibold text-sm">
            {isLives ? "Wait for refill" : "Maybe later"}
          </button>
          <button onClick={onUnlock} className="px-5 py-3 rounded-[10px] bg-accent text-white font-semibold text-sm">
            Continue → Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  selected,
  onClick,
  name,
  price,
  suffix,
  line,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  name: string;
  price: string;
  suffix: string;
  line: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left p-3.5 rounded-[12px] border-[1.5px] transition-colors bg-surface ${
        selected ? "border-accent bg-accent-soft" : "border-line hover:border-ink"
      }`}
    >
      {badge && (
        <span className="absolute -top-2 right-2.5 bg-accent text-white px-2 py-0.5 text-[10px] rounded-full font-bold tracking-wide">
          {badge}
        </span>
      )}
      <div className="font-semibold text-[14px]">{name}</div>
      <div className="text-[22px] font-bold tracking-tight mt-1 tabular-nums">
        {price}
        <small className="text-[12px] font-medium text-muted">{suffix}</small>
      </div>
      <div className="text-muted text-[12px] mt-1">{line}</div>
    </button>
  );
}
