"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  // Give Firebase a moment to refresh and the webhook to land
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setWaiting(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="max-w-md w-full bg-surface border border-line rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto bg-good text-white rounded-full grid place-items-center text-2xl font-bold mb-4">
          ✓
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment received</h1>
        <p className="text-muted mt-2 text-sm">
          Thank you. Your upgrade is being applied to your account.
        </p>

        {waiting ? (
          <p className="text-muted mt-6 text-xs">Activating your premium…</p>
        ) : (
          <p className="text-good mt-6 text-xs">All set.</p>
        )}

        <Link
          href="/"
          className="inline-flex mt-6 items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-accent text-white font-semibold text-sm hover:-translate-y-px transition-transform"
        >
          Return to Kanun
        </Link>

        <p className="text-muted text-[11px] mt-4">
          Receipt has been emailed by Stripe.
        </p>
      </div>
    </main>
  );
}
