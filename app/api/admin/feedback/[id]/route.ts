// PATCH /api/admin/feedback/[id]   → update status
// DELETE /api/admin/feedback/[id]  → remove
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { deleteFeedback, updateFeedbackStatus } from "@/lib/feedbackRepo";
import type { FeedbackStatus } from "@/lib/feedback";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = await verifyAdmin(req.headers.get("authorization"));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status ?? 401 });
  }
  try {
    const { id } = await params;
    const body = (await req.json()) as { status: FeedbackStatus };
    if (!body.status || !["open", "resolved", "dismissed"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await updateFeedbackStatus(id, body.status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = await verifyAdmin(req.headers.get("authorization"));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status ?? 401 });
  }
  try {
    const { id } = await params;
    await deleteFeedback(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
