"use client";

import { useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async () => {
    if (!auth) throw new Error("Firebase auth not initialised");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    await fbSignOut(auth);
  }, []);

  return { user, loading, signIn, signOut };
}
