import { getFirestore, type Firestore } from "firebase/firestore";

import { getFirebaseClientApp } from "./firebase-app";

let firestoreDb: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (!firestoreDb) {
    firestoreDb = getFirestore(getFirebaseClientApp());
  }

  return firestoreDb;
}
