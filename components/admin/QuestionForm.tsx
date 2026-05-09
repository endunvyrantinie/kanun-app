"use client";

import { useEffect, useState } from "react";
import type { DecisionOption, Law, Question, QType } from "@/lib/types";

interface Props {
  initial?: Question | null;
  onSave: (q: Question) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const LAWS: Law[] = ["EA1955", "Sabah", "Sarawak"];
const TYPES: { value: QType; label: string }[] = [
  { value: "mcq", label: "Quiz Blitz / Boss · MCQ" },
  { value: "tf", label: "True / False Rush" },
  { value: "scenario", label: "Scenario Challenge" },
  { value: "violation", label: "Spot the Violation" },
  { value: "decision", label: "Decision Simulator" },
];

function blankQuestion(): Question {
  return {
    id: "",
    type: "mcq",
    law: "EA1955",
    topic: "compliance",
    diff: 1,
    text: "",
    options: ["", "", "", ""],
    answer: 0,
    why: "",
  };
}

export function QuestionForm({ initial, onSave, onCancel, saving }: Props) {
  const [q, setQ] = useState<Question>(initial ?? blankQuestion());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQ(initial ?? blankQuestion());
    setError(null);
  }, [initial]);

  function update<K extends keyof Question>(key: K, value: Question[K]) {
    setQ((prev) => ({ ...prev, [key]: value }));
  }

  function updateStringOption(idx: number, value: string) {
    setQ((prev) => {
      const opts = [...(prev.options as string[])];
      opts[idx] = value;
      return { ...prev, options: opts };
    });
  }

  function updateDecisionOption(idx: number, patch: Partial<DecisionOption>) {
    setQ((prev) => {
      const opts = [...(prev.options as DecisionOption[])];
      opts[idx] = { ...opts[idx], ...patch };
      return { ...prev, options: opts };
    });
  }

  function addOption() {
    setQ((prev) => {
      if (prev.type === "decision") {
        const opts = [...(prev.options as DecisionOption[]), { label: "", score: 0, why: "" }];
        return { ...prev, options: opts };
      }
      const opts = [...(prev.options as string[]), ""];
      return { ...prev, options: opts };
    });
  }

  function removeOption(idx: number) {
    setQ((prev) => {
      const opts = [...(prev.options as unknown[])];
      opts.splice(idx, 1);
      return { ...prev, options: opts as Question["options"] };
    });
  }

  function changeType(newType: QType) {
    setQ((prev) => {
      const next = { ...prev, type: newType };
      if (newType === "tf") {
        next.options = ["True", "False"];
        next.answer = 0;
      } else if (newType === "decision") {
        next.options = [
          { label: "", score: 10, why: "" },
          { label: "", score: 0, why: "" },
        ];
        next.answer = 0;
      } else {
        if (!Array.isArray(prev.options) || (prev.options as DecisionOption[])[0]?.label !== undefined) {
          next.options = ["", "", "", ""];
        }
        next.answer = 0;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!q.id.trim()) return setError("ID is required (e.g. w20)");
    if (!q.text?.trim()) return setError("Question text is required");
    if (q.text && q.text.length < 5) return setError("Question text too short");
    try {
      await onSave(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Field label="ID" hint="Unique, e.g. w20">
          <input
            type="text"
            value={q.id}
            onChange={(e) => update("id", e.target.value.trim())}
            disabled={!!initial}
            className="input"
            required
          />
        </Field>
        <Field label="Mode / Type">
          <select value={q.type} onChange={(e) => changeType(e.target.value as QType)} className="input">
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Law">
          <select value={q.law} onChange={(e) => update("law", e.target.value as Law)} className="input">
            {LAWS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Difficulty (1–5)">
          <input
            type="number"
            min={1}
            max={5}
            value={q.diff}
            onChange={(e) => update("diff", Math.max(1, Math.min(5, Number(e.target.value))) as 1 | 2 | 3 | 4 | 5)}
            className="input"
          />
        </Field>
        <Field label="Who (optional, for scenarios)" hint="e.g. HR Manager, KL fintech">
          <input
            type="text"
            value={q.who ?? ""}
            onChange={(e) => update("who", e.target.value || undefined)}
            className="input"
          />
        </Field>
      </div>

      {(q.type === "scenario" || q.type === "violation" || q.type === "decision") && (
        <Field label="Setup / narrative" hint="The scenario the user reads before the question">
          <textarea
            rows={3}
            value={q.setup ?? ""}
            onChange={(e) => update("setup", e.target.value || undefined)}
            className="input"
          />
        </Field>
      )}

      <Field label="Question text">
        <textarea
          rows={2}
          value={q.text ?? ""}
          onChange={(e) => update("text", e.target.value)}
          className="input"
          required
        />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-semibold text-sm">Options</label>
          {q.type !== "tf" && (
            <button type="button" onClick={addOption} className="text-xs text-accent hover:underline">
              + Add option
            </button>
          )}
        </div>

        <div className="space-y-2">
          {q.type === "decision" ? (
            (q.options as DecisionOption[]).map((opt, i) => (
              <div key={i} className="bg-surface-2 border border-line rounded-[10px] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="answer"
                    checked={q.answer === i}
                    onChange={() => update("answer", i)}
                    className="accent-accent"
                    title="Mark as the best decision (10 points)"
                  />
                  <span className="font-bold text-muted w-6">{String.fromCharCode(65 + i)}.</span>
                  <input
                    type="text"
                    placeholder="Option label"
                    value={opt.label}
                    onChange={(e) => updateDecisionOption(i, { label: e.target.value })}
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    placeholder="Score"
                    value={opt.score}
                    onChange={(e) => updateDecisionOption(i, { score: Number(e.target.value) })}
                    className="input w-20"
                  />
                  <button type="button" onClick={() => removeOption(i)} className="text-bad text-xs px-2">
                    ×
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Why (rationale shown after picking)"
                  value={opt.why}
                  onChange={(e) => updateDecisionOption(i, { why: e.target.value })}
                  className="input text-[13px]"
                />
              </div>
            ))
          ) : (
            (q.options as string[]).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="answer"
                  checked={q.answer === i}
                  onChange={() => update("answer", i)}
                  className="accent-accent"
                  title="Mark as correct answer"
                />
                <span className="font-bold text-muted w-6">{q.type === "tf" ? (i === 0 ? "T" : "F") : String.fromCharCode(65 + i)}.</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateStringOption(i, e.target.value)}
                  className="input flex-1"
                  disabled={q.type === "tf"}
                />
                {q.type !== "tf" && (q.options as string[]).length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="text-bad text-xs px-2">
                    ×
                  </button>
                )}
              </div>
            ))
          )}
          <p className="text-muted text-[12px]">
            {q.type === "decision" 
              ? "Click the radio button next to the best decision (it will be highlighted as correct in the game)." 
              : "Click the radio button next to the correct answer."}
          </p>
        </div>
      </div>

      <Field label="Global Explanation (shown after answering)">
        <textarea
          rows={3}
          value={q.why ?? ""}
          onChange={(e) => update("why", e.target.value)}
          className="input"
        />
      </Field>

      {error && (
        <div className="bg-bad-soft border border-[#F6CCCC] text-bad rounded-[10px] p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-line">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-[10px] border border-line-2 text-ink font-semibold text-sm">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-[10px] bg-accent text-white font-semibold text-sm disabled:opacity-60">
          {saving ? "Saving…" : initial ? "Save changes" : "Create question"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--line, #E8E6E1);
          border-radius: 10px;
          background: white;
          font-size: 14px;
          font-family: inherit;
          color: #0F0F12;
        }
        .input:focus {
          outline: none;
          border-color: #0F0F12;
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold uppercase tracking-wider text-muted mb-1">
        {label}
      </span>
      {children}
      {hint && <span className="text-muted text-[11px] block mt-1">{hint}</span>}
    </label>
  );
}
