"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { QUESTIONS as STATIC_QUESTIONS } from "./questions";
import type { Question } from "./types";

// In-memory cache shared across components within a session
let cache: Question[] | null = null;
let pending: Promise<Question[]> | null = null;

async function fetchQuestions(): Promise<Question[]> {
  if (!db) return STATIC_QUESTIONS;
  try {
    const snap = await getDocs(collection(db, "questions"));
    if (snap.empty) return STATIC_QUESTIONS;
    return snap.docs.map((d) => d.data() as Question);
  } catch (e) {
    console.warn("Falling back to static questions:", e);
    return STATIC_QUESTIONS;
  }
}

export function useQuestions(): { questions: Question[]; loading: boolean } {
  const [questions, setQuestions] = useState<Question[]>(cache ?? STATIC_QUESTIONS);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    if (cache) return; // already populated
    if (!pending) pending = fetchQuestions();
    pending.then((qs) => {
      cache = qs;
      setQuestions(qs);
      setLoading(false);
    });
  }, []);

  return { questions, loading };
}

// Allow admin pages to invalidate the cache after writes
export function invalidateQuestionsCache() {
  cache = null;
  pending = null;
}
