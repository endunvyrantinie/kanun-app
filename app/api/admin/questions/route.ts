// /api/admin/questions
//   GET  → list all questions
//   POST → create or update one question (uses body.id as document ID)

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { listQuestions, upsertQuestion } from "@/lib/questionsRepo";
import type { Question } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const check = await verifyAdmin(req.headers.get("authorization"));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status ?? 401 });
  }
  try {
    const questions = await listQuestions();
    return NextResponse.json({ questions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const check = await verifyAdmin(req.headers.get("authorization"));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status ?? 401 });
  }
  try {
    const body = (await req.json()) as Question;
    if (!body.id || !body.type || !body.law || !body.topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    await upsertQuestion(body);
    return NextResponse.json({ ok: true, id: body.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
