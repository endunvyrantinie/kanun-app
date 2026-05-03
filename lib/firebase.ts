import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Singleton: initialize only once (Next.js hot-reloads this file otherwise)
let app: FirebaseApp;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

if (typeof window !== "undefined") {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  _auth = getAuth(app);
  _db = getFirestore(app);
}

export const auth = _auth;
export const db = _db;
