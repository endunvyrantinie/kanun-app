"use client";

import Link from "next/link";
import type { GameState } from "@/lib/types";
import { AuthButton } from "./AuthButton";
import { useIsAdmin } from "@/lib/isAdminClient";

interface Props {
  state: GameState;
  levelProgress: number;
}

export function AppHeader({ state, levelProgress }: Props) {
  const { isAdmin } = useIsAdmin();
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-bg/85 border-b border-line">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-ink text-white rounded-lg grid place-items-center font-bold text-[13px]">
            K
          </div>
          <div className="text-base font-semibold tracking-tight">
            Kanun
            <span className="text-muted font-normal text-[13px]"> · HR Law, played</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Lives */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line text-[13px]">
          <div className="flex gap-[3px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`block w-3 h-[11px] ${
                  i < state.lives ? "bg-accent" : "bg-line-2"
                }`}
                style={{
                  WebkitMaskImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 21s-7.5-4.6-9.6-10.1C1.1 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.9C13.2 5.1 14.8 4 16.8 4c3.6 0 6.1 3.6 4.8 6.9C19.5 16.4 12 21 12 21z'/></svg>\")",
                  maskImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 21s-7.5-4.6-9.6-10.1C1.1 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.9C13.2 5.1 14.8 4 16.8 4c3.6 0 6.1 3.6 4.8 6.9C19.5 16.4 12 21 12 21z'/></svg>\")",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
            ))}
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line text-[13px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
            <path d="M14 3s.5 4-2 6.5C9 12 8.5 15 11 18s7-1 7-5c0 2 2 3 2 5a8 8 0 1 1-13.6-5.7C8 11 8 8 8 8s4 0 6-5z" />
          </svg>
          <span className="font-semibold tabular-nums">{state.streak}</span>
        </div>

        {/* Level pill */}
        <div className="flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-full bg-ink text-white text-[13px]">
          <span>Lv</span>
          <div className="w-[100px] sm:w-[130px] h-1.5 bg-surface-2/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-[width] duration-700"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <span className="bg-accent text-white font-bold px-2 h-6 min-w-[24px] rounded-full grid place-items-center text-xs">
            {state.level}
          </span>
        </div>

        {/* Admin link (only for admins) */}
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-surface-2 border border-line-2 text-[12px] font-semibold text-ink hover:bg-line"
          >
            Admin
          </Link>
        )}

        {/* Auth */}
        <AuthButton />
      </div>
    </header>
  );
}
