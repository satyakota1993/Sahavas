import type { FirebaseOptions } from "firebase/app";

const requiredFirebaseEnvKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

type RequiredFirebaseEnvKey = (typeof requiredFirebaseEnvKeys)[number];

export const missingFirebaseEnv = requiredFirebaseEnvKeys.filter(
  (key) => !import.meta.env[key],
);

export const firebaseConfigReady = missingFirebaseEnv.length === 0;

export const firebaseRegion = import.meta.env.VITE_FIREBASE_REGION || "asia-south1";

export const firebaseAppCheckSiteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;

function readFirebaseEnv(key: RequiredFirebaseEnvKey): string {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(
      `Missing Firebase environment variable ${key}. Copy .env.example to .env.local and fill the Firebase web app values.`,
    );
  }

  return value;
}

export function getFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: readFirebaseEnv("VITE_FIREBASE_API_KEY"),
    authDomain: readFirebaseEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: readFirebaseEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: readFirebaseEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readFirebaseEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readFirebaseEnv("VITE_FIREBASE_APP_ID"),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}
