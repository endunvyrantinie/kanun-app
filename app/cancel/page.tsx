"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="max-w-md w-full bg-surface border border-line rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto bg-surface-2 text-muted rounded-full grid place-items-center text-2xl mb-4">
          ←
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">No worries</h1>
        <p className="text-muted mt-2 text-sm">
          You closed the checkout before completing the payment. No charge has been made.
        </p>
        <Link
          href="/"
          className="inline-flex mt-6 items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-ink text-white font-semibold text-sm"
        >
          Back to Kanun
        </Link>
      </div>
    </main>
  );
}
