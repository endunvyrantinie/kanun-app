// POST /api/admin/seed — one-time migration of the static 104 questions
// into Firestore. Idempotent: skips IDs that already exist.

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { bulkUpsert } from "@/lib/questionsRepo";
import { QUESTIONS } from "@/lib/questions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const check = await verifyAdmin(req.headers.get("authorization"));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status ?? 401 });
  }
  try {
    const result = await bulkUpsert(QUESTIONS);
    return NextResponse.json({ ok: true, ...result, total: QUESTIONS.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Seed failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
