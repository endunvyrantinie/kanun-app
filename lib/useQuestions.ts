"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "./firebase";
import { QUESTIONS as STATIC_QUESTIONS } from "./questions";
import type { Question } from "./types";

// In-memory cache shared across components within a session
let globalQuestions: Question[] | null = null;
let listeners: Array<(qs: Question[]) => void> = [];

export function useQuestions(): { questions: Question[]; loading: boolean } {
  const [questions, setQuestions] = useState<Question[]>(globalQuestions ?? STATIC_QUESTIONS);
  const [loading, setLoading] = useState(globalQuestions === null);

  useEffect(() => {
    if (!db) return;

    // If we already have a global listener, just subscribe to local state updates
    const onChange = (qs: Question[]) => {
      setQuestions(qs);
      setLoading(false);
    };
    listeners.push(onChange);

    // If this is the first caller, set up the Firestore listener
    let unsubscribe: () => void = () => {};
    if (listeners.length === 1) {
      const q = query(collection(db, "questions"));
      unsubscribe = onSnapshot(q, (snap) => {
        const qs = snap.empty 
          ? STATIC_QUESTIONS 
          : snap.docs.map((d) => d.data() as Question);
        globalQuestions = qs;
        listeners.forEach(l => l(qs));
      }, (err) => {
        console.error("Error fetching real-time questions:", err);
        // Fallback to static if error
        if (!globalQuestions) {
          globalQuestions = STATIC_QUESTIONS;
          listeners.forEach(l => l(STATIC_QUESTIONS));
        }
      });
    }

    return () => {
      listeners = listeners.filter(l => l !== onChange);
      if (listeners.length === 0) {
        unsubscribe();
        globalQuestions = null;
      }
    };
  }, []);

  return { questions, loading };
}

// Kept for compatibility, though onSnapshot makes it mostly redundant
export function invalidateQuestionsCache() {
  // No-op now as onSnapshot handles it, but we can keep the export
}
