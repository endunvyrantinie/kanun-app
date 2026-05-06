"use client";

// Client-side helper to submit user feedback on a specific question.
// Stored in Firestore `feedback` collection — admin reviews via /admin/feedback.

import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

export interface FeedbackInput {
  questionId: string;
  userId: string;
  userEmail: string | null;
  comment: string;
}

export type FeedbackStatus = "open" | "resolved" | "dismissed";

export interface FeedbackDoc extends FeedbackInput {
  id?: string;
  createdAt: string;
  status: FeedbackStatus;
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  if (!db) throw new Error("Database unavailable");
  const c = input.comment.trim();
  if (c.length < 5) throw new Error("Tell us a bit more (at least 5 characters)");
  if (c.length > 500) throw new Error("Keep it under 500 characters");

  await addDoc(collection(db, "feedback"), {
    questionId: input.questionId,
    userId: input.userId,
    userEmail: input.userEmail ?? null,
    comment: c,
    createdAt: new Date().toISOString(),
    status: "open" as FeedbackStatus,
  });
}
