"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuestions } from "@/lib/useQuestions";
import type { DecisionOption, Mode, ModeId, Question, SkillKey } from "@/lib/types";
import { lawLabel, topicToSkill, totalXpToReach, xpForLevel } from "@/lib/progression";
import { FeedbackForm } from "./FeedbackForm";

type GameSession = {
  mode: Mode;
  questions: Question[];
  perQuestionTime: number; // 0 = no timer
};

interface Props {
  mode: Mode | null;
  premium: boolean;
  level: number;
  xp: number;
  onClose: () => void;
  onAwardXp: (amount: number, skillKey?: SkillKey) => void;
  onLoseLife: () => void;
  onAddBadge: (key: string) => void;
  onToast: (text: string, level?: number) => void;
}

// Plain-English consequence framing — gives a "real-world stakes" line under every answer.
function consequenceFor(q: Question, correct: boolean): string {
  const law = q.law === "EA1955" ? "EA 1955" : q.law === "Sabah" ? "Sabah Labour Ordinance" : "Sarawak Labour Ordinance";
  if (correct) {
    return `Compliant with ${law}. Move on with confidence.`;
  }
  // Topic-aware "wrong" framing
  switch (q.topic) {
    case "wages":
      return `In real life: wage shortfall claims can mean back-pay orders, fines, or DGIR investigations.`;
    case "hours":
      return `In real life: this could trigger an OT-pay claim or DGIR complaint.`;
    case "leave":
      return `In real life: denying valid leave can attract claims and Industrial Court action.`;
    case "termination":
      return `In real life: a wrong call here often ends in unjust dismissal claims and back-wages.`;
    case "recruitment":
      return `In real life: discriminatory hiring breaches s.60M and PDPA 2010 — penalties and reputation damage follow.`;
    case "compliance":
      return `In real life: non-compliance can mean penalties, fines, or worse — a tainted record.`;
    default:
      return `In real life: a wrong call here can trigger penalties, disputes, or Industrial Court claims.`;
  }
}

function pickQuestions(pool: Question[], filter: (q: Question) => boolean, n: number): Question[] {
  const candidates = pool.filter(filter);
  const arr = [...candidates];
  const out: Question[] = [];
  while (out.length < n && arr.length) {
    const idx = Math.floor(Math.random() * arr.length);
    out.push(arr.splice(idx, 1)[0]);
  }
  return out;
}

function buildSession(pool: Question[], mode: Mode, level: number): GameSession {
  switch (mode.id) {
    case "blitz": {
      let qs = pickQuestions(pool, (q) => q.type === "mcq" && q.diff <= Math.max(2, level), 5);
      if (qs.length < 5) qs = qs.concat(pickQuestions(pool, (q) => q.type === "mcq" && !qs.includes(q), 5 - qs.length));
      return { mode, questions: qs, perQuestionTime: 15 };
    }
    case "tf": {
      const qs = pickQuestions(pool, (q) => q.type === "tf", 8);
      return { mode, questions: qs, perQuestionTime: 8 };
    }
    case "scenario": {
      let qs = pickQuestions(pool, (q) => q.type === "scenario", 3);
      if (qs.length < 3) qs = qs.concat(pickQuestions(pool, (q) => q.type === "mcq" && q.diff >= 3 && !qs.includes(q), 3 - qs.length));
      return { mode, questions: qs, perQuestionTime: 0 };
    }
    case "violation": {
      let qs = pickQuestions(pool, (q) => q.type === "violation", 3);
      if (qs.length < 3) qs = qs.concat(pickQuestions(pool, (q) => q.type === "scenario" && !qs.includes(q), 3 - qs.length));
      return { mode, questions: qs, perQuestionTime: 0 };
    }
    case "decision": {
      const qs = pickQuestions(pool, (q) => q.type === "decision", 2);
      return { mode, questions: qs, perQuestionTime: 0 };
    }
    case "boss": {
      let qs = pickQuestions(pool, (q) => q.diff >= 4, 3);
      if (qs.length < 3) qs = qs.concat(pickQuestions(pool, (q) => q.diff >= 3 && !qs.includes(q), 3 - qs.length));
      return { mode, questions: qs, perQuestionTime: 0 };
    }
    default:
      return { mode, questions: [], perQuestionTime: 0 };
  }
}

export function GameStage(props: Props) {
  const { mode, level, xp, onClose, onAwardXp, onLoseLife, onAddBadge, onToast } = props;

  const { questions: pool } = useQuestions();
  const session = useMemo(
    () => (mode ? buildSession(pool, mode, level) : null),
    [mode, level, pool],
  );
  const [qIndex, setQIndex] = useState(0);
  const [statuses, setStatuses] = useState<("active" | "done" | "miss" | "")[]>([]);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; why: string; extra?: string; consequence?: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<null | {
    totalXp: number;
    accuracy: number;
    correct: number;
    perfect: boolean;
    bossWon?: boolean;
    bossKO?: boolean;
    decisionScore?: number;
  }>(null);

  // For tallying within a session
  const tallyRef = useRef({ correct: 0, totalXp: 0, perfect: true, decisionScore: 0, alive: true, streak: 0 });

  // Init when session changes
  useEffect(() => {
    if (!session) return;
    setQIndex(0);
    setStatuses(session.questions.map((_, i) => (i === 0 ? "active" : "")));
    setAnswered(false);
    setChosen(null);
    setFeedback(null);
    setResults(null);
    tallyRef.current = { correct: 0, totalXp: 0, perfect: true, decisionScore: 0, alive: true, streak: 0 };
    if (session.perQuestionTime > 0) setTimeLeft(session.perQuestionTime);
    else setTimeLeft(0);
  }, [session]);

  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!session || session.perQuestionTime === 0 || answered || results) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, answered, session, results]);

  function setStatus(i: number, s: "active" | "done" | "miss" | "") {
    setStatuses((prev) => {
      const next = [...prev];
      next[i] = s;
      return next;
    });
  }

  function handleTimeout() {
    if (answered || !session) return;
    setAnswered(true);
    tallyRef.current.perfect = false;
    tallyRef.current.streak = 0;
    onLoseLife();
    setStatus(qIndex, "miss");
    const q = session.questions[qIndex];
    setFeedback({
      ok: false,
      why: `Time's up — ${q.why ?? ""}`,
      consequence: consequenceFor(q, false),
    });
  }

  function handleChoose(choice: number) {
    if (answered || !session) return;
    setAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setChosen(choice);
    const q = session.questions[qIndex];

    if (q.type === "decision") {
      const opt = (q.options as DecisionOption[])[choice];
      const ok = opt.score >= 6;
      const earn = Math.max(0, opt.score) * 3 + 5;
      tallyRef.current.totalXp += earn;
      tallyRef.current.decisionScore += opt.score;
      onAwardXp(earn, topicToSkill(q.topic));
      onToast(`+${earn} XP · score ${opt.score >= 0 ? "+" : ""}${opt.score}`);
      if (!ok) {
        onLoseLife();
        tallyRef.current.perfect = false;
        tallyRef.current.streak = 0;
      } else {
        tallyRef.current.correct++;
        tallyRef.current.streak++;
        maybeCelebrateStreak();
      }
      setStatus(qIndex, ok ? "done" : "miss");
      setFeedback({
        ok,
        why: opt.why,
        extra: `Score: ${opt.score >= 0 ? "+" : ""}${opt.score}`,
        consequence: consequenceFor(q, ok),
      });
      return;
    }

    const ok = choice === q.answer;
    if (ok) {
      tallyRef.current.correct++;
      tallyRef.current.streak++;
      let earn = 10;
      if (mode?.id === "blitz") earn = 10 + Math.max(0, timeLeft);
      else if (mode?.id === "tf") earn = 8 + Math.max(0, timeLeft);
      else if (mode?.id === "scenario") earn = 18 + q.diff * 4;
      else if (mode?.id === "violation") earn = 22;
      else if (mode?.id === "boss") earn = 50 + q.diff * 8;
      tallyRef.current.totalXp += earn;
      onAwardXp(earn, topicToSkill(q.topic));
      onToast(`+${earn} XP`);
      maybeCelebrateStreak();
      setStatus(qIndex, "done");
      setFeedback({ ok: true, why: q.why ?? "", consequence: consequenceFor(q, true) });
    } else {
      tallyRef.current.perfect = false;
      tallyRef.current.streak = 0;
      onLoseLife();
      if (mode?.id === "boss") {
        tallyRef.current.alive = false;
        onLoseLife(); // boss bites extra
      }
      setStatus(qIndex, "miss");
      setFeedback({ ok: false, why: q.why ?? "", consequence: consequenceFor(q, false) });
    }
  }

  function maybeCelebrateStreak() {
    const s = tallyRef.current.streak;
    if (s === 3) onToast("🔥 3 in a row");
    else if (s === 5) onToast("🔥🔥 5 in a row · keep going");
    else if (s === 7) onToast("🔥🔥🔥 7 in a row · unstoppable");
    else if (s >= 10 && s % 5 === 0) onToast(`🔥 ${s} in a row · monster`);
  }

  function next() {
    if (!session) return;
    const isBoss = mode?.id === "boss";
    const lastIdx = qIndex === session.questions.length - 1;
    if (lastIdx || (isBoss && !tallyRef.current.alive)) {
      finalize();
      return;
    }
    setQIndex(qIndex + 1);
    setStatus(qIndex + 1, "active");
    setAnswered(false);
    setChosen(null);
    setFeedback(null);
    if (session.perQuestionTime > 0) setTimeLeft(session.perQuestionTime);
  }

  function finalize() {
    if (!session) return;
    const t = tallyRef.current;
    const total = session.questions.length;
    const accuracy = mode?.id === "decision"
      ? Math.max(0, Math.round((t.decisionScore / (total * 10)) * 100))
      : Math.round((t.correct / total) * 100);

    if (t.correct > 0) onAddBadge("first");
    if (t.perfect && t.correct === total && mode?.id === "blitz") onAddBadge("perfect");
    if (mode?.id === "boss" && t.alive && t.correct === total) onAddBadge("boss1");

    setResults({
      totalXp: t.totalXp,
      accuracy,
      correct: t.correct,
      perfect: t.perfect,
      bossWon: mode?.id === "boss" ? t.alive && t.correct === total : undefined,
      bossKO: mode?.id === "boss" ? !t.alive : undefined,
      decisionScore: mode?.id === "decision" ? t.decisionScore : undefined,
    });
  }

  if (!mode || !session) return null;

  const q = session.questions[qIndex];

  // RESULTS SCREEN
  if (results) {
    const big = results.bossWon ? "WIN" : results.bossKO ? "KO" : `+${results.totalXp}`;
    const inLevel = xp - totalXpToReach(level);
    const levelPct = Math.round((inLevel / xpForLevel(level)) * 100);
    return (
      <Modal title="Round-up" chip="Results" onClose={onClose}>
        <div className="text-center py-3">
          <div className="text-[64px] font-bold tracking-tight text-accent leading-none tabular-nums">{big}</div>
          <div className="text-muted mt-1.5 text-[13px] uppercase tracking-wider">
            {results.bossWon || results.bossKO ? "Result" : "XP earned"}
          </div>
          <h2 className="mt-4 text-[26px] font-semibold tracking-tight">Nice round.</h2>
          <p className="text-muted mt-1.5">
            {results.decisionScore != null
              ? `Judgment score ${results.decisionScore}`
              : `Accuracy ${results.accuracy}% · ${results.correct} clean answer${results.correct === 1 ? "" : "s"}.`}
          </p>

          {!results.bossKO && (
            <div className="bg-ink text-white rounded-[12px] p-4 flex items-center gap-3.5 my-4 text-left">
              <div className="w-12 h-12 rounded-full bg-accent grid place-items-center font-bold text-lg">
                {level}
              </div>
              <div className="text-white/85 text-[13px]">
                <b className="text-white">Level {level}</b>
                <br />
                You&apos;re {Math.max(0, levelPct)}% to Level {level + 1}.
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5 my-5">
            <Stat v={`${results.accuracy}%`} k="Accuracy" />
            <Stat v={String(results.correct)} k="Correct" />
            <Stat v={`+${results.totalXp}`} k="XP earned" />
          </div>
        </div>
        <Footer
          left={<button onClick={onClose} className="px-4 py-3 rounded-[10px] bg-transparent border border-line-2 text-ink font-semibold text-sm">Done</button>}
          right={<button onClick={onClose} className="px-4 py-3 rounded-[10px] bg-accent text-white font-semibold text-sm">Close</button>}
        />
      </Modal>
    );
  }

  // PLAYING
  return (
    <Modal
      title={mode.name}
      chip={mode.tag}
      onClose={onClose}
      progress={statuses}
      timer={session.perQuestionTime > 0 ? { left: timeLeft, max: session.perQuestionTime } : undefined}
    >
      {mode.id === "boss" && (
        <div className="bg-ink text-white rounded-[12px] p-3.5 flex items-center gap-3 mb-3.5">
          <div className="w-11 h-11 rounded-[10px] bg-accent grid place-items-center text-2xl">⚖</div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Datin Sharifah, KESUMA Inspector</div>
            <div className="text-white/65 text-[12px]">Audit visit — answer correctly to keep your run alive.</div>
            <div className="w-full h-2 bg-white/[0.14] rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-[width] duration-300"
                style={{ width: `${100 - (tallyRef.current.correct / session.questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <QuestionView q={q} onChoose={handleChoose} chosen={chosen} answered={answered} feedback={feedback} />

      <Footer
        left={<span className="text-muted text-[13px]">{qIndex + 1} of {session.questions.length}</span>}
        right={
          answered ? (
            <button
              onClick={next}
              className="px-5 py-3 rounded-[10px] bg-ink text-white font-semibold text-sm"
            >
              {qIndex === session.questions.length - 1 || (mode.id === "boss" && !tallyRef.current.alive)
                ? "See results"
                : "Next →"}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-[10px] bg-transparent border border-line-2 text-ink font-semibold text-sm"
            >
              Quit
            </button>
          )
        }
      />
    </Modal>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Modal({
  title,
  chip,
  onClose,
  progress,
  timer,
  children,
}: {
  title: string;
  chip?: string;
  onClose: () => void;
  progress?: ("active" | "done" | "miss" | "")[];
  timer?: { left: number; max: number };
  children: React.ReactNode;
}) {
  // body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const timerCls = timer
    ? timer.left / timer.max < 0.2
      ? "bg-bad-soft text-bad animate-pulse"
      : timer.left / timer.max < 0.4
      ? "bg-[#FFE7D6] text-[#B45309]"
      : "bg-surface-2 text-ink"
    : "";

  return (
    <div className="fixed inset-0 bg-black/55 z-50 flex items-stretch justify-center sm:p-6">
      <div className="bg-bg w-full max-w-[720px] h-full sm:h-auto sm:max-h-[calc(100vh-48px)] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3.5 px-4.5 py-3.5 border-b border-line bg-surface" style={{ paddingLeft: "18px", paddingRight: "18px" }}>
          <div className="font-semibold text-[15px] flex items-center gap-2.5">
            {title}
            {chip && <span className="bg-accent-soft text-accent px-2 py-0.5 rounded-full text-[11px] font-semibold">{chip}</span>}
          </div>
          {progress && (
            <div className="flex-1 max-w-[220px]">
              <div className="flex gap-1">
                {progress.map((s, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-colors ${
                      s === "done" ? "bg-good" : s === "miss" ? "bg-bad" : s === "active" ? "bg-accent" : "bg-surface-2"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          {timer && (
            <div
              className={`tabular-nums font-semibold text-[13px] px-2.5 py-1 rounded-full min-w-[56px] text-center ${timerCls}`}
            >
              {timer.left}
            </div>
          )}
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
          {children}
        </div>
      </div>
    </div>
  );
}

function Footer({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  // Footer rendered at the bottom — using a portal-less approach: it's appended after children
  return (
    <div className="border-t border-line bg-surface px-4.5 py-3.5 flex justify-between gap-2.5 items-center -mx-[18px] -mb-5 mt-5" style={{ paddingLeft: "18px", paddingRight: "18px" }}>
      {left}
      {right}
    </div>
  );
}

function Stat({ v, k }: { v: string; k: string }) {
  return (
    <div className="bg-surface border border-line rounded-[12px] p-3.5">
      <div className="text-[22px] font-semibold tabular-nums">{v}</div>
      <div className="text-muted text-[12px] mt-0.5">{k}</div>
    </div>
  );
}

function QuestionView({
  q,
  onChoose,
  chosen,
  answered,
  feedback,
}: {
  q: Question;
  onChoose: (i: number) => void;
  chosen: number | null;
  answered: boolean;
  feedback: { ok: boolean; why: string; extra?: string; consequence?: string } | null;
}) {
  const isTF = q.type === "tf";
  const opts = q.type === "decision"
    ? (q.options as DecisionOption[]).map((o) => o.label)
    : (q.options as string[]);

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-3.5">
        <span className="bg-accent-soft text-accent px-2.5 py-1 rounded-full text-[11px] font-medium">
          {lawLabel(q.law)}
        </span>
        <span className="bg-surface-2 text-muted px-2.5 py-1 rounded-full text-[11px] font-medium">
          {q.topic}
        </span>
        <span className="bg-surface-2 text-muted px-2.5 py-1 rounded-full text-[11px] font-medium">
          Difficulty {q.diff}
        </span>
      </div>

      {q.setup && (
        <div className="bg-surface border border-line rounded-[12px] p-4 text-ink-2 text-[14px] leading-relaxed mb-4">
          {q.who && (
            <span className="block text-muted text-[12px] uppercase tracking-wider font-semibold mb-1">
              {q.who}
            </span>
          )}
          {q.setup}
        </div>
      )}

      <div className="text-[clamp(18px,2.4vw,22px)] leading-snug font-medium tracking-tight">
        {q.text}
      </div>

      <div className="flex flex-col gap-2.5 mt-4.5">
        {opts.map((label, i) => {
          const isCorrect = q.type !== "decision" && i === q.answer;
          const isChosen = chosen === i;
          const isCorrectDecision = q.type === "decision" && (q.options as DecisionOption[])[i].score >= 6;
          let cls = "border-line bg-surface";
          if (answered) {
            if (q.type === "decision" ? isCorrectDecision : isCorrect) cls = "bg-good-soft border-good";
            else if (isChosen) cls = "bg-bad-soft border-bad";
            else cls = "border-line bg-surface opacity-55";
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => onChoose(i)}
              className={`text-left px-4 py-3.5 border-[1.5px] rounded-[12px] text-[15px] flex items-center gap-3 transition-all ${cls} ${
                !answered ? "hover:border-ink hover:translate-x-0.5" : ""
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg grid place-items-center font-semibold text-[13px] flex-shrink-0 ${
                  answered && (q.type === "decision" ? isCorrectDecision : isCorrect)
                    ? "bg-good text-white"
                    : answered && isChosen
                    ? "bg-bad text-white"
                    : "bg-surface-2 text-muted"
                }`}
              >
                {isTF ? (i === 0 ? "T" : "F") : String.fromCharCode(65 + i)}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`mt-4 p-4 rounded-[12px] border ${
            feedback.ok ? "bg-good-soft border-[#B6E5D2]" : "bg-bad-soft border-[#F6CCCC]"
          } animate-[pop_0.25s_cubic-bezier(.2,.8,.2,1)]`}
          style={{ transformOrigin: "top center" }}
        >
          <div className="font-semibold flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full grid place-items-center text-white text-xs font-bold ${feedback.ok ? "bg-good" : "bg-bad"}`}>
              {feedback.ok ? "✓" : "×"}
            </span>
            {feedback.ok ? "Nailed it" : "Oof, close"}
          </div>
          {feedback.consequence && (
            <div className={`mt-1.5 text-[12px] font-semibold ${feedback.ok ? "text-good" : "text-bad"}`}>
              {feedback.ok ? "✓" : "⚠️"} {feedback.consequence}
            </div>
          )}
          <div className="mt-2 text-ink-2 text-[14px] leading-relaxed">{feedback.why}</div>
          {feedback.extra && <div className="mt-1.5 text-muted text-[12px]">{feedback.extra}</div>}
          <FeedbackForm questionId={q.id} />
        </div>
      )}
      <style jsx>{`
        @keyframes pop {
          0% { transform: scale(0.96); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
