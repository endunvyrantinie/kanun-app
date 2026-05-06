// Server-side helpers for the `feedback` collection.
import { getAdminDb } from "./firebaseAdmin";
import type { FeedbackDoc, FeedbackStatus } from "./feedback";

const COLLECTION = "feedback";

function db() {
  return getAdminDb().collection(COLLECTION);
}

export async function listFeedback(): Promise<FeedbackDoc[]> {
  const snap = await db().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeedbackDoc, "id">) }));
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  await db().doc(id).update({ status });
}

export async function deleteFeedback(id: string): Promise<void> {
  await db().doc(id).delete();
}
