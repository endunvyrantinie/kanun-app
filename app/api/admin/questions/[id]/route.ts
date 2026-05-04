// /api/admin/questions/[id]
//   DELETE → remove the question

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { deleteQuestion } from "@/lib/questionsRepo";

export const runtime = "nodejs";

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
    await deleteQuestion(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
