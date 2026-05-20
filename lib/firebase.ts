// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { MonthRecord } from "@/types/gala";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy singleton — only runs in the browser
export function getDb(): Firestore {
  if (typeof window === "undefined") {
    throw new Error("Firestore can only be accessed client-side.");
  }
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export async function saveRecord(
  record: Omit<MonthRecord, "id" | "createdAt">
): Promise<void> {
  const ref = collection(getDb(), "gala_records");
  await addDoc(ref, { ...record, createdAt: serverTimestamp() });
}

export async function fetchRecords(): Promise<MonthRecord[]> {
  const ref  = collection(getDb(), "gala_records");
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MonthRecord, "id">) }));
}
