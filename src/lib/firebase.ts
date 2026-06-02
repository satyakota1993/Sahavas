import { getFirebaseClientApp } from "@/firebase/firebase-app";
import { getFirebaseAuth } from "@/firebase/auth";
import { getFirestoreDb } from "@/firebase/firestore";
import { getFirebaseFunctions } from "@/firebase/functions";
import { getFirebaseStorage } from "@/firebase/storage";
import {
  firebaseAppCheckSiteKey,
  firebaseConfigReady,
  firebaseRegion,
  missingFirebaseEnv,
} from "@/firebase/config";

export const firebaseApp = getFirebaseClientApp;
export const firebaseAuth = getFirebaseAuth;
export const firestore = getFirestoreDb;
export const firebaseFunctions = getFirebaseFunctions;
export const firebaseStorage = getFirebaseStorage;

export const firebaseEnvironment = {
  ready: firebaseConfigReady,
  missingKeys: missingFirebaseEnv,
  region: firebaseRegion,
  appCheckSiteKey: firebaseAppCheckSiteKey,
} as const;
