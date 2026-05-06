"use client";

import { useState } from "react";
import { QUESTIONS } from "@/lib/questions";

interface Props {
  onQuickPlay: () => void;
  onBrowse: () => void;
}

const SHARE_URL = "https://funhr.online";
const SHARE_TITLE = "funhr — learn HR like a game";
const SHARE_TEXT = "Quick rounds on Malaysian HR law. Way better than reading the EA1955 — try a round:";

export function HomeHero({ onQuickPlay, onBrowse }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // Mobile / supported browsers: native share sheet
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    // Desktop fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: ask the user to copy manually
      window.prompt("Copy this link:", SHARE_URL);
    }
  }

  return (
    <div className="bg-surface border border-line rounded-[14px] p-7 sm:p-8 shadow-sm relative overflow-hidden">
      <div className="inline-flex items-center gap-2 text-muted text-[12px] uppercase tracking-wider mb-3.5">
        <span className="w-1.5 h-1.5 bg-accent rounded-full" />
        HR shouldn&apos;t be boring
      </div>

      <h1 className="text-[clamp(28px,4vw,44px)] font-semibold leading-[1.1] tracking-tight">
        Learn <span className="text-accent">HR</span> the way you learned <span className="text-accent">Tetris</span>.
      </h1>

      <p className="text-muted mt-2.5 max-w-[56ch]">
        Quick rounds. Real Malaysian workplace rules. Zero PDFs. Play five questions on your coffee break and accidentally end up knowing more than your boss.
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
        <button
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-[10px] border border-line-2 text-ink font-semibold text-[15px] hover:-translate-y-px transition-transform"
          title="Share funhr.online with a friend"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {copied ? "Link copied!" : "Share"}
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
