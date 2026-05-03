"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { GameState, SkillKey } from "./types";
import { levelFromXp, xpForLevel, totalXpToReach } from "./progression";
import { useAuth } from "./useAuth";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const STORAGE_KEY = "kanun.v1";

const defaultState: GameState = {
  xp: 0,
  level: 1,
  lives: 5,
  streak: 0,
  lastPlayed: null,
  premium: false,
  skill: { recruitment: 0, termination: 0, compliance: 0, leave: 0, wages: 0 },
  badges: [],
  bestQuiz: 0,
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

// Pick the higher / more advanced of two states (used when merging local progress
// into an existing Firestore record after first sign-in).
function mergeStates(a: GameState, b: GameState): GameState {
  return {
    xp: Math.max(a.xp, b.xp),
    level: Math.max(a.level, b.level),
    lives: Math.max(a.lives, b.lives),
    streak: Math.max(a.streak, b.streak),
    lastPlayed: a.lastPlayed && b.lastPlayed
      ? (a.lastPlayed > b.lastPlayed ? a.lastPlayed : b.lastPlayed)
      : a.lastPlayed ?? b.lastPlayed,
    premium: a.premium || b.premium,
    skill: {
      recruitment: Math.max(a.skill.recruitment, b.skill.recruitment),
      termination: Math.max(a.skill.termination, b.skill.termination),
      compliance: Math.max(a.skill.compliance, b.skill.compliance),
      leave: Math.max(a.skill.leave, b.skill.leave),
      wages: Math.max(a.skill.wages, b.skill.wages),
    },
    badges: Array.from(new Set([...a.badges, ...b.badges])),
    bestQuiz: Math.max(a.bestQuiz, b.bestQuiz),
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

    // Signed out: nothing more to do (localStorage already loaded)
    if (!user) {
      lastUidRef.current = null;
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
          // Push merged state back so cloud is up to date
          await setDoc(ref, merged, { merge: true });
        } else {
          // First sign-in: push local state to cloud
          const local = loadFromStorage();
          await setDoc(ref, local);
          setState(local);
        }
        setSyncStatus("synced");
      } catch (e) {
        console.error("Firestore load failed:", e);
        setSyncStatus("error");
      }
    })();
  }, [user, authLoading, hydrated]);

  // Step 3: on every state change, save to localStorage immediately + Firestore (debounced)
  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(state);

    if (user && db) {
      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(() => {
        setDoc(doc(db!, "users", user.uid), state, { merge: true }).catch((e) => {
          console.error("Firestore save failed:", e);
        });
      }, 600);
    }
  }, [state, hydrated, user]);

  const awardXp = useCallback((amount: number, skillKey?: SkillKey) => {
    setState((s) => {
      const newXp = s.xp + amount;
      const newLevel = levelFromXp(newXp);
      const newSkill = { ...s.skill };
      if (skillKey && newSkill[skillKey] != null) {
        newSkill[skillKey] = Math.min(100, newSkill[skillKey] + Math.round(amount * 0.6));
      }
      const newBadges = [...s.badges];
      if (newLevel >= 5 && !newBadges.includes("rising")) newBadges.push("rising");
      if (newLevel >= 10 && !newBadges.includes("senior")) newBadges.push("senior");
      return { ...s, xp: newXp, level: newLevel, skill: newSkill, badges: newBadges };
    });
  }, []);

  const loseLife = useCallback(() => {
    setState((s) => ({ ...s, lives: Math.max(0, s.lives - 1) }));
  }, []);

  const refillLives = useCallback(() => {
    setState((s) => ({ ...s, lives: 5 }));
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

  const xpInLevel = state.xp - totalXpToReach(state.level);
  const xpNeededForLevel = xpForLevel(state.level);
  const levelProgress = Math.min(100, (xpInLevel / xpNeededForLevel) * 100);

  return {
    state,
    hydrated,
    levelProgress,
    syncStatus,
    user,
    actions: {
      awardXp,
      loseLife,
      refillLives,
      bumpStreak,
      grantPremium,
      addBadge,
    },
  };
}
