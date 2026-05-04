// Server-side helpers for reading/writing questions in Firestore.
// Collection: `questions`, document IDs match the question's `id` field.

import { getAdminDb } from "./firebaseAdmin";
import type { Question } from "./types";

const COLLECTION = "questions";

function db() {
  return getAdminDb().collection(COLLECTION);
}

export async function listQuestions(): Promise<Question[]> {
  const snap = await db().get();
  return snap.docs.map((d) => d.data() as Question);
}

export async function getQuestion(id: string): Promise<Question | null> {
  const snap = await db().doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as Question;
}

export async function upsertQuestion(q: Question): Promise<void> {
  await db().doc(q.id).set(q);
}

export async function deleteQuestion(id: string): Promise<void> {
  await db().doc(id).delete();
}

export async function bulkUpsert(questions: Question[]): Promise<{ written: number; skipped: number }> {
  const adminDb = getAdminDb();
  let written = 0;
  let skipped = 0;
  // Firestore batch limit is 500; chunk if needed
  for (let i = 0; i < questions.length; i += 400) {
    const chunk = questions.slice(i, i + 400);
    const batch = adminDb.batch();
    for (const q of chunk) {
      const ref = db().doc(q.id);
      const existing = await ref.get();
      if (existing.exists) {
        skipped++;
      } else {
        batch.set(ref, q);
        written++;
      }
    }
    await batch.commit();
  }
  return { written, skipped };
}
