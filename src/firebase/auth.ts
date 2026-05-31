import { getAuth, type Auth } from "firebase/auth";

import { getFirebaseClientApp } from "./firebase-app";

let firebaseAuth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseClientApp());
  }

  return firebaseAuth;
}
