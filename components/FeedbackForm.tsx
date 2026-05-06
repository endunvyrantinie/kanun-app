"use client";

import { useState } from "react";
import { submitFeedback } from "@/lib/feedback";
import { useAuth } from "@/lib/useAuth";

interface Props {
  questionId: string;
}

export function FeedbackForm({ questionId }: Props) {
  const { user, signIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p className="mt-2 text-[12px] text-good">
        ✓ Thanks — we&apos;ll review it.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-[12px] text-muted hover:text-ink underline-offset-2 hover:underline transition-colors"
      >
        Disagree with this answer? Tell us →
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      try {
        await signIn();
      } catch {
        setError("Please sign in to submit feedback.");
      }
      return;
    }
    setBusy(true);
    try {
      await submitFeedback({
        questionId,
        userId: user.uid,
        userEmail: user.email,
        comment,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[12px] font-semibold text-muted uppercase tracking-wider">
          What&apos;s wrong with this answer?
        </label>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setComment("");
            setError(null);
          }}
          className="text-[12px] text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={
          user
            ? "e.g. The correct answer should be X because..."
            : "You'll be asked to sign in before sending."
        }
        className="w-full px-3 py-2 border border-line rounded-[10px] text-[13px] font-sans bg-white focus:outline-none focus:border-ink resize-none"
        maxLength={500}
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px] text-muted">{comment.length}/500</span>
        <button
          type="submit"
          disabled={busy || comment.trim().length < 5}
          className="px-3.5 py-1.5 rounded-[8px] bg-ink text-white text-[12px] font-semibold disabled:opacity-50"
        >
          {busy ? "Sending…" : !user ? "Sign in & send" : "Send feedback"}
        </button>
      </div>
      {error && (
        <p className="text-[12px] text-bad mt-1.5">{error}</p>
      )}
    </form>
  );
}
