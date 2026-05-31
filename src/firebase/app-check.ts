import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

import { firebaseAppCheckSiteKey } from "./config";
import { getFirebaseClientApp } from "./firebase-app";

let appCheckStarted = false;

export function setupAppCheck(): void {
  if (appCheckStarted || !firebaseAppCheckSiteKey) {
    return;
  }

  initializeAppCheck(getFirebaseClientApp(), {
    provider: new ReCaptchaV3Provider(firebaseAppCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  appCheckStarted = true;
}
