import { getFunctions, type Functions } from "firebase/functions";

import { firebaseRegion } from "./config";
import { getFirebaseClientApp } from "./firebase-app";

let firebaseFunctions: Functions | null = null;

export function getFirebaseFunctions(): Functions {
  if (!firebaseFunctions) {
    firebaseFunctions = getFunctions(getFirebaseClientApp(), firebaseRegion);
  }

  return firebaseFunctions;
}
