"use client";

// Client-side hook to check if the signed-in user is an admin.
// Calls /api/admin/me which performs the real check server-side.

import { useEffect, useState } from "react";
import { auth } from "./firebase";

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        if (!auth?.currentUser) {
          if (!cancelled) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setIsAdmin(res.ok);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    }
    // Re-check whenever auth state changes
    const unsub = auth?.onAuthStateChanged(() => {
      setLoading(true);
      check();
    });
    check();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  return { isAdmin, loading };
}
