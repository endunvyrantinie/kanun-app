"use client";

import { useEffect, useState } from "react";
import type { Mode } from "@/lib/types";
import { PRO } from "@/lib/tiers";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

interface Props {
  open: boolean;
  reason: "lock" | "lives" | "premium";
  mode?: Mode | null;
  level: number;
  user: User | null;
  onClose: () => void;
  onSignInPrompt: () => void;
}

export function Paywall({
  open,
  reason,
  mode,
  level,
  user,
  onClose,
  onSignInPrompt,
}: Props) {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Suppress unused-variable lint — we keep this prop for future use even though
  // the in-component flow now handles sign-in automatically.
  void onSignInPrompt;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    setError(null);
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const need = mode?.minLevel ?? 5;
  const pct = Math.min(100, Math.round((level / need) * 100));
  const isLives = reason === "lives";

  async function handleUpgrade() {
    setError(null);
    setBusy(true);

    // Step 1 · ensure the user is signed in (open Google popup if not)
    let activeUser: User | null = user;
    if (!activeUser) {
      try {
        await signIn();
        // After signIn() resolves, the SDK has the new user on `auth.currentUser`
        activeUser = auth?.currentUser ?? null;
      } catch {
        setError("Sign-in cancelled. You need an account so we can attach your purchase.");
        setBusy(false);
        return;
      }
      if (!activeUser) {
        setError("Sign-in didn't complete. Please try again.");
        setBusy(false);
        return;
      }
    }

    // Step 2 · create the Stripe Checkout session and redirect
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "pro",
          uid: activeUser.uid,
          email: activeUser.email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout");
      }
      window.location.href = data.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      setError(msg);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/55 z-[55] flex items-stretch justify-center sm:p-6">
      <div className="bg-bg w-full max-w-[560px] h-full sm:h-auto sm:max-h-[calc(100vh-48px)] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div
          className="flex items-center justify-between gap-3.5 py-3.5 border-b border-line bg-surface"
          style={{ paddingLeft: "18px", paddingRight: "18px" }}
        >
          <div className="font-semibold text-[15px] flex items-center gap-2.5">
            {isLives ? "Game over (for now)" : "Unlock Kanun Pro"}
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

        <div
          className="flex-1 overflow-y-auto py-5"
          style={{ paddingLeft: "18px", paddingRight: "18px" }}
        >
          <div className="bg-ink text-white rounded-[12px] p-4 sm:p-5 flex items-center gap-3.5 mb-4 relative overflow-hidden">
            <div
              className="absolute -top-10 -right-15 w-[200px] h-[200px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(124,58,237,.45), transparent 70%)",
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
                {isLives ? "You died. Like, mathematically." : `Unlock ${mode?.name ?? "everything"} for good`}
              </h2>
              <p className="text-white/75 mt-1 text-[13px]">
                {isLives
                  ? "Wait 15 minutes for a free refill — or upgrade for unlimited play."
                  : `One-time RM10.90. Yours forever. Every mode, every level, every jurisdiction.`}
              </p>
            </div>
          </div>

          {!isLives && level < need && (
            <div className="bg-surface border border-line rounded-[12px] p-4 mb-3.5">
              <div className="flex justify-between items-center mb-2">
                <b className="text-[14px]">You&apos;re {pct}% to Lv {need}</b>
                <span className="text-accent text-[13px] font-semibold">{pct}%</span>
              </div>
              <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-[width] duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-muted text-[12px] mt-2">Or skip the grind — unlock everything below.</p>
            </div>
          )}

          {/* Single product card */}
          <div className="bg-surface border-2 border-accent rounded-[14px] p-5 mb-3 relative">
            <div className="absolute -top-2.5 left-4 bg-accent text-white px-2.5 py-0.5 text-[10px] font-bold rounded-full tracking-wide">
              ONE-TIME PAYMENT
            </div>
            <div className="flex items-baseline justify-between mb-3 mt-1">
              <h3 className="text-[18px] font-semibold tracking-tight">{PRO.name}</h3>
              <div className="text-[28px] font-bold tracking-tight tabular-nums">
                {PRO.priceLabel}
              </div>
            </div>
            <ul className="flex flex-col gap-2 mt-2">
              {PRO.perks.map((perk) => (
                <li key={perk} className="pl-6 relative text-[14px] text-ink-2">
                  <span className="absolute left-0 top-1.5 w-4 h-4 bg-good rounded-full grid place-items-center text-white text-[10px]">✓</span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          {!user && (
            <div className="mt-3 bg-accent-soft border border-[#FFD8C2] rounded-[10px] p-3 text-[13px] text-ink-2">
              Sign in first so we can attach your purchase to your account.
            </div>
          )}

          {error && (
            <div className="mt-3 bg-bad-soft border border-[#F6CCCC] rounded-[10px] p-3 text-[13px] text-bad">
              {error}
            </div>
          )}

          <p className="text-muted text-center mt-3.5 text-[12px]">
            Secure payment via Stripe · Receipt emailed · No subscription
          </p>
        </div>

        <div
          className="border-t border-line bg-surface py-3.5 flex justify-between gap-2.5 items-center"
          style={{ paddingLeft: "18px", paddingRight: "18px" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-[10px] bg-transparent border border-line-2 text-ink font-semibold text-sm"
          >
            {isLives ? "Close" : "Maybe later"}
          </button>
          <button
            onClick={handleUpgrade}
            disabled={busy}
            className="px-5 py-3 rounded-[10px] bg-accent text-white font-semibold text-sm disabled:opacity-60"
          >
            {busy
              ? "Opening checkout…"
              : !user
              ? `Sign in & pay ${PRO.priceLabel} →`
              : `Pay ${PRO.priceLabel} →`}
          </button>
        </div>
      </div>
    </div>
  );
}
