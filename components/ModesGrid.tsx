"use client";

import { MODES } from "@/lib/modes";
import type { GameState, Mode } from "@/lib/types";

interface Props {
  state: GameState;
  onPlay: (mode: Mode) => void;
}

export function ModesGrid({ state, onPlay }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {MODES.map((mode) => {
        // Premium users bypass the level gate
        const locked = !state.premium && state.level < mode.minLevel;
        const requiresPremium = mode.premium && !state.premium;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onPlay(mode)}
            className={`text-left bg-surface border border-line rounded-[14px] p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-line-2 relative overflow-hidden ${
              locked ? "opacity-95" : ""
            }`}
          >
            {mode.id === "boss" && (
              <div className="absolute top-0 right-0 px-3 py-1 bg-accent text-white text-[11px] font-semibold rounded-bl-[14px]">
                Boss
              </div>
            )}
            {locked && (
              <div className="absolute top-3.5 right-3.5 z-10 bg-ink text-white px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3z" />
                </svg>
                Lv {mode.minLevel}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-[10px] grid place-items-center ${
                  locked ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={mode.iconPath} />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-[15px]">{mode.name}</div>
                <div className="text-[12px] text-muted">{mode.tag}</div>
              </div>
            </div>

            <div className="text-[13px] text-ink-2 leading-relaxed">{mode.desc}</div>

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed border-line">
              <div className="flex gap-2.5 text-[12px] text-muted">
                <span>+{10 + mode.minLevel * 4} XP</span>
                <span>·</span>
                <span>{requiresPremium ? "Premium" : "Free"}</span>
              </div>
              <span
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5 ${
                  locked ? "bg-surface-2 text-muted" : "bg-ink text-white"
                }`}
              >
                {locked ? "Unlock" : "Play"}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
