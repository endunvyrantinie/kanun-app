"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { GameState, SkillKey } from "./types";
import { levelFromXp, xpForLevel, totalXpToReach } from "./progression";
import { useAuth } from "./useAuth";
import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const STORAGE_KEY = "kanun.v1";

const REFILL_MINUTES = 15;
const MAX_LIVES = 5;

const defaultState: GameState = {
  xp: 0,
  level: 1,
  lives: 5,
  livesRefilledAt: null,
  streak: 0,
  lastPlayed: null,
  premium: false,
  tier: "free",
  skill: { recruitment: 0, termination: 0, compliance: 0, leave: 0, wages: 0 },
  badges: [],
  bestQuiz: 0,
  seenQuestions: [],
};

function loadFromStorage(): GameState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

function saveToStorage(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy mode errors
  }
}

// Firestore rejects undefined field values. Strip them before any setDoc.
function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

// Fields the client is allowed to write. Server-owned fields like tier,
// premium, purchasedAt, stripeCustomerId, stripeSessionId are ONLY written
// by the Stripe webhook — clients must never overwrite them.
function clientWriteFields(state: GameState) {
  return {
    xp: state.xp,
    level: state.level,
    lives: state.lives,
    streak: state.streak,
    lastPlayed: state.lastPlayed,
    skill: state.skill,
    badges: state.badges,
    bestQuiz: state.bestQuiz,
    seenQuestions: state.seenQuestions,
  };
}

// Pick the higher / more advanced of two states (used when merging local progress
// into an existing Firestore record after first sign-in).
function mergeStates(a: GameState, b: GameState): GameState {
  // Pick the more advanced tier. Anything that isn't "free" counts as paid.
  const rank = (t: string) => (t === "free" ? 0 : 1);
  const winningTier = rank(a.tier) >= rank(b.tier) ? a.tier : b.tier;
  return {
    xp: Math.max(a.xp, b.xp),
    level: Math.max(a.level, b.level),
    lives: Math.max(a.lives, b.lives),
    livesRefilledAt: a.livesRefilledAt ?? b.livesRefilledAt ?? null,
    streak: Math.max(a.streak, b.streak),
    lastPlayed: a.lastPlayed && b.lastPlayed
      ? (a.lastPlayed > b.lastPlayed ? a.lastPlayed : b.lastPlayed)
      : a.lastPlayed ?? b.lastPlayed,
    premium: a.premium || b.premium,
    tier: winningTier,
    purchasedAt: a.purchasedAt ?? b.purchasedAt,
    skill: {
      recruitment: Math.max(a.skill.recruitment, b.skill.recruitment),
      termination: Math.max(a.skill.termination, b.skill.termination),
      compliance: Math.max(a.skill.compliance, b.skill.compliance),
      leave: Math.max(a.skill.leave, b.skill.leave),
      wages: Math.max(a.skill.wages, b.skill.wages),
    },
    badges: Array.from(new Set([...a.badges, ...b.badges])),
    bestQuiz: Math.max(a.bestQuiz, b.bestQuiz),
    seenQuestions: Array.from(new Set([...a.seenQuestions, ...b.seenQuestions])),
  };
}
export function useGameState() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<GameState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");

  // Debounce timer for Firestore writes
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUidRef = useRef<string | null>(null);

  // Step 1: hydrate from localStorage on first mount (always — gives instant UI)
  useEffect(() => {
    setState(loadFromStorage());
    setHydrated(true);
  }, []);

  // Step 2: when auth state resolves, fetch + merge from Firestore
  useEffect(() => {
    if (!hydrated || authLoading) return;

    // Signed out: reset anonymous users to level 1 but preserve seenQuestions
    if (!user) {
      lastUidRef.current = null;
      setState((current) => {
        // If they have progress but no user, they're an anonymous user
        // Reset to level 1 but keep seenQuestions so they don't see repeated questions
        if (current.xp > 0 || current.level > 1) {
          return {
            ...defaultState,
            seenQuestions: current.seenQuestions,
          };
        }
        return current;
      });
      return;
    }
    // Same user as last time: skip — no need to refetch
    if (lastUidRef.current === user.uid) return;
    lastUidRef.current = user.uid;

    if (!db) return;
    setSyncStatus("syncing");

    (async () => {
      try {
        const ref = doc(db!, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const cloud = { ...defaultState, ...snap.data() } as GameState;
          // Merge with local in case user played before signing in
          const local = loadFromStorage();
          const merged = mergeStates(cloud, local);
          setState(merged);
          // Push only client fields back — never overwrite server-owned tier/premium
          await setDoc(ref, stripUndefined(clientWriteFields(merged)), { merge: true });
        } else {
          // First sign-in: push local client fields to cloud
          const local = loadFromStorage();
          await setDoc(ref, stripUndefined(clientWriteFields(local)));
          setState(local);
        }
        setSyncStatus("synced");
      } catch (e) {
        console.error("Firestore load failed:", e);
        setSyncStatus("error");
      }
    })();
  }, [user, authLoading, hydrated]);

  // Step 3: subscribe to real-time updates of server-owned fields (tier, premium,
  // purchasedAt). When there's no user, force tier back to "free" — paid status
  // should never apply to anonymous visitors, regardless of cached localStorage.
  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      setState((current) =>
        current.tier === "free" && current.premium === false
          ? current
          : { ...current, tier: "free", premium: false, purchasedAt: undefined },
      );
      return;
    }

    if (!db) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const cloud = snap.data() as Partial<GameState>;
      setState((current) => {
        const next = { ...current };
        let changed = false;
        if (cloud.tier && cloud.tier !== current.tier) {
          next.tier = cloud.tier;
          changed = true;
        }
        if (typeof cloud.premium === "boolean" && cloud.premium !== current.premium) {
          next.premium = cloud.premium;
          changed = true;
        }
        if (cloud.purchasedAt && cloud.purchasedAt !== current.purchasedAt) {
          next.purchasedAt = cloud.purchasedAt;
          changed = true;
        }
        return changed ? next : current;
      });
    });
    return () => unsub();
  }, [user, hydrated]);

  // Step 4: on every state change, save to localStorage immediately + Firestore (debounced)
  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(state);

    if (user && db) {
      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(() => {
        setDoc(doc(db!, "users", user.uid), stripUndefined(clientWriteFields(state)), { merge: true }).catch((e) => {
          console.error("Firestore save failed:", e);
        });
      }, 600);
    }
  }, [state, hydrated, user]);

  const [lastLevelUp, setLastLevelUp] = useState<{ from: number; to: number; at: number } | null>(null);

  const awardXp = useCallback((amount: number, skillKey?: SkillKey) => {
    setState((s) => {
      const newXp = Math.max(0, s.xp + amount); // never go below zero
      const newLevel = levelFromXp(newXp);
      const newSkill = { ...s.skill };
      if (amount > 0 && skillKey && newSkill[skillKey] != null) {
        newSkill[skillKey] = Math.min(100, newSkill[skillKey] + Math.round(amount * 0.6));
      }
      const newBadges = [...s.badges];
      if (newLevel >= 5 && !newBadges.includes("rising")) newBadges.push("rising");
      if (newLevel >= 10 && !newBadges.includes("senior")) newBadges.push("senior");
      // Detect level-up so the UI can fire confetti / role-up moments
      if (newLevel > s.level) {
        setLastLevelUp({ from: s.level, to: newLevel, at: Date.now() });
      }
      return { ...s, xp: newXp, level: newLevel, skill: newSkill, badges: newBadges };
    });
  }, []);

  const loseLife = useCallback(() => {
    setState((s) => {
      // Pro and above never lose lives
      if (s.tier !== "free") return s;
      const newLives = Math.max(0, s.lives - 1);
      // Start the refill clock when lives first drop below max
      const livesRefilledAt = s.lives === MAX_LIVES ? new Date().toISOString() : s.livesRefilledAt;
      return { ...s, lives: newLives, livesRefilledAt };
    });
  }, []);

  const refillLives = useCallback(() => {
    setState((s) => ({ ...s, lives: MAX_LIVES, livesRefilledAt: null }));
  }, []);

  const bumpStreak = useCallback(() => {
    setState((s) => {
      const today = new Date().toISOString().slice(0, 10);
      if (s.lastPlayed === today) return s;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().slice(0, 10);
      const newStreak = s.lastPlayed === yKey ? s.streak + 1 : 1;
      const newBadges = [...s.badges];
      if (newStreak >= 7 && !newBadges.includes("streak7")) newBadges.push("streak7");
      return { ...s, streak: newStreak, lastPlayed: today, badges: newBadges };
    });
  }, []);

  const grantPremium = useCallback(() => {
    setState((s) => ({ ...s, premium: true }));
  }, []);

  const addBadge = useCallback((key: string) => {
    setState((s) => (s.badges.includes(key) ? s : { ...s, badges: [...s.badges, key] }));
  }, []);

  // Effective level: free tier capped at FREE_LEVEL_CAP (20). Pro is uncapped.
  const FREE_LEVEL_CAP = 20;
  const effectiveLevel = state.tier === "free" ? Math.min(FREE_LEVEL_CAP, state.level) : state.level;
  const isCapped = state.tier === "free" && state.level >= FREE_LEVEL_CAP;

  const xpInLevel = state.xp - totalXpToReach(state.level);
  const xpNeededForLevel = xpForLevel(state.level);
  const levelProgress = Math.min(100, (xpInLevel / xpNeededForLevel) * 100);

  // ---- Lives refill (free tier only) ----
  // Background: every 60s, check if 30 minutes have passed and add a life if so.
  useEffect(() => {
    if (state.tier !== "free") return;
    if (state.lives >= MAX_LIVES || !state.livesRefilledAt) return;
    const tick = () => {
      const minsSince = (Date.now() - new Date(state.livesRefilledAt!).getTime()) / 60000;
      if (minsSince >= REFILL_MINUTES) {
        setState((s) => {
          if (s.tier !== "free" || s.lives >= MAX_LIVES) return s;
          const newLives = Math.min(MAX_LIVES, s.lives + 1);
          const stillRefilling = newLives < MAX_LIVES;
          return {
            ...s,
            lives: newLives,
            livesRefilledAt: stillRefilling ? new Date().toISOString() : null,
          };
        });
      }
    };
    tick();
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, [state.tier, state.lives, state.livesRefilledAt]);

  // Live countdown string (MM:SS) — re-renders every second while a refill is pending
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (state.tier !== "free") return;
    if (state.lives >= MAX_LIVES || !state.livesRefilledAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.tier, state.lives, state.livesRefilledAt]);

  let refillIn: string | null = null;
  if (state.tier === "free" && state.lives < MAX_LIVES && state.livesRefilledAt) {
    const elapsedMs = now - new Date(state.livesRefilledAt).getTime();
    const remaining = Math.max(0, REFILL_MINUTES * 60 * 1000 - elapsedMs);
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    refillIn = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return {
    state,
    hydrated,
    levelProgress,
    syncStatus,
    user,
    lastLevelUp,
    refillIn,
    effectiveLevel,
    isCapped,
    actions: {
      awardXp,
      loseLife,
      refillLives,
      bumpStreak,
      grantPremium,
      addBadge,
      markQuestionSeen: useCallback((id: string) => {
        setState((s) => {
          if (s.seenQuestions.includes(id)) return s;
          return { ...s, seenQuestions: [...s.seenQuestions, id] };
        });
      }, []),
      resetSeenQuestions: useCallback(() => {
        setState((s) => ({ ...s, seenQuestions: [] }));
      }, []),
    },
  };
}
