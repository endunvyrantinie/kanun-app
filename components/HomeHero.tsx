"use client";

import { QUESTIONS } from "@/lib/questions";

interface Props {
  onQuickPlay: () => void;
  onBrowse: () => void;
}

export function HomeHero({ onQuickPlay, onBrowse }: Props) {
  return (
    <div className="bg-surface border border-line rounded-[14px] p-7 sm:p-8 shadow-sm relative overflow-hidden">
      <div className="inline-flex items-center gap-2 text-muted text-[12px] uppercase tracking-wider mb-3.5">
        <span className="w-1.5 h-1.5 bg-accent rounded-full" />
        Master Malaysian labour law
      </div>

      <h1 className="text-[clamp(28px,4vw,44px)] font-semibold leading-[1.1] tracking-tight">
        Learn the <span className="text-accent">Employment Act</span> the way you learned <span className="text-accent">Tetris</span>.
      </h1>

      <p className="text-muted mt-2.5 max-w-[56ch]">
        One-minute games on the Employment Act 1955, Sabah Labour Ordinance, and Sarawak Labour Ordinance. Built for HR teams, in-house counsel, and managers who&apos;d rather earn XP than read a PDF.
      </p>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <button
          onClick={onQuickPlay}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-[10px] bg-accent text-white font-semibold text-[15px] hover:-translate-y-px transition-transform"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Quick play · 60 seconds
        </button>
        <button
          onClick={onBrowse}
          className="inline-flex items-center justify-center px-5 py-3.5 rounded-[10px] border border-line-2 text-ink font-semibold text-[15px] hover:-translate-y-px transition-transform"
        >
          Browse 6 modes
        </button>
      </div>

      <div className="flex gap-4 mt-5 text-muted text-[13px] flex-wrap">
        <span><b className="text-ink font-semibold">{QUESTIONS.length}</b> questions</span>
        <span><b className="text-ink font-semibold">3</b> jurisdictions</span>
        <span><b className="text-ink font-semibold">5</b> skill tracks</span>
        <span><b className="text-ink font-semibold">22</b> levels</span>
      </div>
    </div>
  );
}
