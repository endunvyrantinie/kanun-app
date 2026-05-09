"use client";

import { useAuth } from "@/lib/useAuth";

export function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="px-3 py-1.5 rounded-full bg-surface border border-line text-[13px] text-muted">
        …
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt={user.displayName ?? "user"}
            className="w-7 h-7 rounded-full border border-line"
          />
        )}
        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 rounded-full bg-surface border border-line text-[13px] hover:border-line-2"
          title={user.email ?? ""}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      data-auth-button
      onClick={() => signIn().catch((e) => alert("Sign-in failed: " + e.message + "\n\nTip: If this is an 'unauthorized-domain' error, go to Firebase Console > Authentication > Settings > Authorized Domains and add '" + window.location.hostname + "' to the list."))}
      className="px-3 py-1.5 rounded-full bg-ink text-white text-[13px] font-semibold hover:opacity-90"
    >
      Sign in
    </button>
  );
}
