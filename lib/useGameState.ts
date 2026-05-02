"use client";

import { useEffect, useState, useCallback } from "react";
import type { GameState, SkillKey } from "./types";
import { levelFromXp, xpForLevel, totalXpToReach } from "./progression";

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

export function useGameState() {
  // Hydrate after mount to avoid SSR/CSR mismatch
  const [state, setState] = useState<GameState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(state);
  }, [state, hydrated]);

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
