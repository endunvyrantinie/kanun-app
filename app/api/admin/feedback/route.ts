// GET /api/admin/feedback — list all feedback (admin only)
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { listFeedback } from "@/lib/feedbackRepo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const check = await verifyAdmin(req.headers.get("authorization"));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status ?? 401 });
  }
  try {
    const feedback = await listFeedback();
    return NextResponse.json({ feedback });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
