import { getStorage, type FirebaseStorage } from "firebase/storage";

import { getFirebaseClientApp } from "./firebase-app";

let firebaseStorage: FirebaseStorage | null = null;

export function getFirebaseStorage(): FirebaseStorage {
  if (!firebaseStorage) {
    firebaseStorage = getStorage(getFirebaseClientApp());
  }

  return firebaseStorage;
}
