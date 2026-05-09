"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useIsAdmin } from "@/lib/isAdminClient";
import { QuestionForm } from "@/components/admin/QuestionForm";
import type { QType, Question } from "@/lib/types";
import { auth } from "@/lib/firebase";
import { invalidateQuestionsCache } from "@/lib/useQuestions";

const TYPE_LABEL: Record<QType, string> = {
  mcq: "Quiz Blitz",
  tf: "T/F Rush",
  scenario: "Scenario",
  violation: "Violation",
  decision: "Decision",
};

export default function AdminPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<QType | "all">("all");
  const [filterDiff, setFilterDiff] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

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

  async function loadQuestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/admin/questions");
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      const data = await res.json();
      setQuestions(data.questions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadQuestions();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    if (!questions) return [];
    return questions.filter((q) => {
      if (filterType !== "all" && q.type !== filterType) return false;
      if (filterDiff !== "all" && q.diff !== filterDiff) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        const hay = `${q.id} ${q.text ?? ""} ${q.setup ?? ""} ${q.why ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [questions, filterType, filterDiff, search]);

  async function handleSave(q: Question) {
    setSaving(true);
    try {
      const res = await authedFetch("/api/admin/questions", {
        method: "POST",
        body: JSON.stringify(q),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      invalidateQuestionsCache();
      await loadQuestions();
      setEditing(null);
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete question "${id}"? This cannot be undone.`)) return;
    try {
      const res = await authedFetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      invalidateQuestionsCache();
      await loadQuestions();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function handleSeed() {
    if (!confirm("Import the 104 default questions into Firestore? Existing IDs will be skipped.")) return;
    setSeeding(true);
    setSeedMsg(null);
    try {
      const res = await authedFetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Seed failed");
      setSeedMsg(`Imported ${data.written} new, skipped ${data.skipped} existing.`);
      invalidateQuestionsCache();
      await loadQuestions();
    } catch (e) {
      setSeedMsg(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  // GATES ----------------------------------------------------
  if (authLoading) {
    return <CenterMsg>Loading…</CenterMsg>;
  }
  if (!user) {
    return (
      <CenterMsg>
        <p className="mb-4">You need to sign in to access the admin.</p>
        <button onClick={() => signIn()} className="px-5 py-2.5 rounded-[10px] bg-ink text-white font-semibold text-sm">
          Sign in with Google
        </button>
      </CenterMsg>
    );
  }
  if (adminLoading) {
    return <CenterMsg>Checking admin access…</CenterMsg>;
  }
  if (!isAdmin) {
    return (
      <CenterMsg>
        <p className="font-semibold mb-2">Not authorized</p>
        <p className="text-muted text-sm mb-4">
          Your email <code className="bg-surface-2 px-1.5 py-0.5 rounded">{user.email}</code> isn&apos;t in the admin allowlist. Add it to the <code className="bg-surface-2 px-1.5 py-0.5 rounded">ADMIN_EMAILS</code> environment variable in Vercel and redeploy.
        </p>
        <Link href="/" className="text-accent hover:underline">← Back to Kanun</Link>
      </CenterMsg>
    );
  }

  // ADMIN UI ----------------------------------------------------
  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link href="/" className="text-muted text-[13px] hover:text-ink">← Kanun</Link>
          <h1 className="text-3xl font-semibold tracking-tight">Admin · Questions</h1>
          <p className="text-muted text-[13px] mt-1">
            {questions === null ? "—" : `${questions.length} questions in Firestore · ${filtered.length} shown`}
          </p>
        </div>
        <div className="flex gap-2">
          {questions !== null && questions.length === 0 && (
            <button onClick={handleSeed} disabled={seeding} className="px-4 py-2.5 rounded-[10px] border border-line-2 text-ink font-semibold text-sm">
              {seeding ? "Importing…" : "Import default 104 questions"}
            </button>
          )}
          <button
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
            className="px-5 py-2.5 rounded-[10px] bg-accent text-white font-semibold text-sm"
          >
            + New question
          </button>
        </div>
      </div>

      {seedMsg && (
        <div className="bg-good-soft border border-[#B6E5D2] text-good rounded-[10px] p-3 mb-4 text-sm">
          {seedMsg}
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface border border-line rounded-[12px] p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as QType | "all")} className="input">
          <option value="all">All modes</option>
          <option value="mcq">Quiz Blitz / Boss · MCQ</option>
          <option value="tf">True / False Rush</option>
          <option value="scenario">Scenario</option>
          <option value="violation">Violation</option>
          <option value="decision">Decision</option>
        </select>
        <select value={filterDiff} onChange={(e) => setFilterDiff(e.target.value === "all" ? "all" : Number(e.target.value))} className="input">
          <option value="all">All difficulties</option>
          <option value="1">Difficulty 1</option>
          <option value="2">Difficulty 2</option>
          <option value="3">Difficulty 3</option>
          <option value="4">Difficulty 4</option>
          <option value="5">Difficulty 5</option>
        </select>
        <input
          type="text"
          placeholder="Search text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
      </div>

      {error && (
        <div className="bg-bad-soft border border-[#F6CCCC] text-bad rounded-[10px] p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Empty seed CTA */}
      {!loading && questions !== null && questions.length === 0 && (
        <div className="bg-surface border border-dashed border-line-2 rounded-[12px] p-8 text-center">
          <p className="font-semibold mb-1">No questions in Firestore yet.</p>
          <p className="text-muted text-sm mb-4">
            Click &quot;Import default 104 questions&quot; above to seed the database, or create one manually with &quot;+ New question&quot;.
          </p>
        </div>
      )}

      {/* Table */}
      {loading && <p className="text-muted text-sm">Loading…</p>}
      {!loading && filtered.length > 0 && (
        <div className="bg-surface border border-line rounded-[12px] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-muted">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">ID</th>
                <th className="text-left px-3 py-3 font-semibold">Mode</th>
                <th className="text-left px-3 py-3 font-semibold">Diff</th>
                <th className="text-left px-3 py-3 font-semibold">Question</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-t border-line hover:bg-surface-2/40">
                  <td className="px-4 py-2.5 font-mono text-[12px]">{q.id}</td>
                  <td className="px-3 py-2.5">{TYPE_LABEL[q.type]}</td>
                  <td className="px-3 py-2.5">{q.diff}</td>
                  <td className="px-3 py-2.5 max-w-[500px] truncate">
                    {q.text ?? q.setup}
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-2">
                    <button onClick={() => setEditing(q)} className="text-accent hover:underline">Edit</button>
                    <button onClick={() => handleDelete(q.id)} className="text-bad hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {(creating || editing) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-bg w-full max-w-[640px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? "Edit Question" : "New Question"}</h2>
            <QuestionForm
              initial={editing}
              onSave={handleSave}
              onCancel={() => {
                setCreating(false);
                setEditing(null);
              }}
              saving={saving}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--line, #E8E6E1);
          border-radius: 10px;
          background: white;
          font-size: 14px;
          font-family: inherit;
          color: #0F0F12;
        }
        .input:focus {
          outline: none;
          border-color: #0F0F12;
        }
      `}</style>
    </main>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      {children}
    </div>
  );
}
