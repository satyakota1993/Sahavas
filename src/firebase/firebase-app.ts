import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

import { getFirebaseConfig } from "./config";

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseClientApp(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
  return firebaseApp;
}
