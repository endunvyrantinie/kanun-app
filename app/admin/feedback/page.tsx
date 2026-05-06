"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useIsAdmin } from "@/lib/isAdminClient";
import { auth } from "@/lib/firebase";
import type { FeedbackDoc, FeedbackStatus } from "@/lib/feedback";

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  open: "Open",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const STATUS_COLOR: Record<FeedbackStatus, string> = {
  open: "bg-accent-soft text-accent",
  resolved: "bg-good-soft text-good",
  dismissed: "bg-surface-2 text-muted",
};

export default function AdminFeedbackPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [items, setItems] = useState<FeedbackDoc[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedbackStatus | "all">("open");

  async function authedFetch(input: string, init?: RequestInit) {
    if (!auth?.currentUser) throw new Error("Not signed in");
    const token = await auth.currentUser.getIdToken();
    return fetch(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/admin/feedback");
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      const data = await res.json();
      setItems(data.feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (filter === "all") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    if (!items) return { open: 0, resolved: 0, dismissed: 0, all: 0 };
    return {
      open: items.filter((i) => i.status === "open").length,
      resolved: items.filter((i) => i.status === "resolved").length,
      dismissed: items.filter((i) => i.status === "dismissed").length,
      all: items.length,
    };
  }, [items]);

  async function setStatus(id: string, status: FeedbackStatus) {
    try {
      const res = await authedFetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this feedback permanently?")) return;
    try {
      const res = await authedFetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  // Gates
  if (authLoading) return <CenterMsg>Loading…</CenterMsg>;
  if (!user) {
    return (
      <CenterMsg>
        <p className="mb-4">Sign in required.</p>
        <button onClick={() => signIn()} className="px-5 py-2.5 rounded-[10px] bg-ink text-white font-semibold text-sm">
          Sign in with Google
        </button>
      </CenterMsg>
    );
  }
  if (adminLoading) return <CenterMsg>Checking admin access…</CenterMsg>;
  if (!isAdmin) {
    return (
      <CenterMsg>
        <p className="font-semibold mb-2">Not authorized</p>
        <Link href="/" className="text-accent hover:underline">← Back to Kanun</Link>
      </CenterMsg>
    );
  }

  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link href="/admin" className="text-muted text-[13px] hover:text-ink">← Admin</Link>
          <h1 className="text-3xl font-semibold tracking-tight">Feedback</h1>
          <p className="text-muted text-[13px] mt-1">
            User-submitted feedback on individual questions.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["open", "resolved", "dismissed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border ${
              filter === f
                ? "bg-ink text-white border-ink"
                : "bg-surface text-ink border-line hover:border-line-2"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABEL[f]}{" "}
            <span className={filter === f ? "text-white/70" : "text-muted"}>
              ({counts[f]})
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-bad-soft border border-[#F6CCCC] text-bad rounded-[10px] p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading && <p className="text-muted text-sm">Loading…</p>}

      {!loading && filtered.length === 0 && items && (
        <div className="bg-surface border border-dashed border-line-2 rounded-[12px] p-8 text-center">
          <p className="text-muted text-sm">
            No {filter === "all" ? "" : filter} feedback yet.
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((f) => (
            <div key={f.id} className="bg-surface border border-line rounded-[12px] p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLOR[f.status]}`}>
                    {STATUS_LABEL[f.status]}
                  </span>
                  <Link
                    href="/admin"
                    className="font-mono text-[13px] text-accent hover:underline"
                  >
                    {f.questionId}
                  </Link>
                  <span className="text-muted text-[12px]">
                    {f.userEmail ?? f.userId.slice(0, 6)}
                  </span>
                  <span className="text-muted text-[12px]">·</span>
                  <span className="text-muted text-[12px]">
                    {new Date(f.createdAt).toLocaleString("en-MY")}
                  </span>
                </div>
                <div className="flex gap-1.5 text-[12px]">
                  {f.status !== "resolved" && (
                    <button onClick={() => setStatus(f.id!, "resolved")} className="px-2.5 py-1 rounded-md bg-good-soft text-good font-semibold hover:bg-good hover:text-white">
                      Resolve
                    </button>
                  )}
                  {f.status !== "dismissed" && (
                    <button onClick={() => setStatus(f.id!, "dismissed")} className="px-2.5 py-1 rounded-md bg-surface-2 text-muted font-semibold hover:bg-line hover:text-ink">
                      Dismiss
                    </button>
                  )}
                  {f.status !== "open" && (
                    <button onClick={() => setStatus(f.id!, "open")} className="px-2.5 py-1 rounded-md bg-accent-soft text-accent font-semibold">
                      Reopen
                    </button>
                  )}
                  <button onClick={() => remove(f.id!)} className="px-2.5 py-1 rounded-md text-bad font-semibold hover:bg-bad-soft">
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2.5 text-[14px] text-ink-2 leading-relaxed whitespace-pre-wrap">
                {f.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="max-w-md w-full bg-surface border border-line rounded-2xl p-8 text-center shadow-sm">
        {children}
      </div>
    </main>
  );
}
