// Server-side helper to verify a request comes from an admin user.
// Reads ADMIN_EMAILS env var (comma-separated allowlist) and checks the
// caller's Firebase ID token against it.

import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "./firebaseAdmin";

export interface AdminCheck {
  ok: boolean;
  email?: string;
  uid?: string;
  error?: string;
  status?: number;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyAdmin(authHeader: string | null): Promise<AdminCheck> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, error: "Missing Authorization header", status: 401 };
  }
  const token = authHeader.slice(7);
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
    const email = (decoded.email ?? "").toLowerCase();
    if (!email) return { ok: false, error: "No email in token", status: 401 };
    if (!adminEmails().includes(email)) {
      return { ok: false, error: "Not an admin", status: 403 };
    }
    return { ok: true, email, uid: decoded.uid };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Token verification failed";
    return { ok: false, error: msg, status: 401 };
  }
}
