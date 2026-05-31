import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type UserCredential,
} from "firebase/auth";

import { getFirebaseAuth } from "@/firebase/auth";

import { ensureUserProfile } from "./user-profile.service";

export interface EmailSignInInput {
  email: string;
  password: string;
}

export interface EmailRegistrationInput extends EmailSignInInput {
  displayName: string;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithPopup(auth, provider);
  await ensureUserProfile(credential.user);
  return credential;
}

export async function signInWithEmail(input: EmailSignInInput): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(
    auth,
    input.email.trim(),
    input.password,
  );
  await ensureUserProfile(credential.user);
  return credential;
}

export async function registerWithEmail(
  input: EmailRegistrationInput,
): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email.trim(),
    input.password,
  );

  if (input.displayName.trim()) {
    await updateProfile(credential.user, { displayName: input.displayName.trim() });
  }

  await sendEmailVerification(credential.user);
  await ensureUserProfile(credential.user);
  return credential;
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}
