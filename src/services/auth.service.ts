import {
  applyActionCode,
  browserLocalPersistence,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
  type User,
  type UserCredential,
} from "firebase/auth";

import { getFirebaseAuth } from "@/firebase/auth";

import { recordAuditEventQuietly } from "./audit.service";
import { assertPasswordPolicy } from "./password-policy";
import { ensureUserProfile } from "./user-profile.service";

export const EMAIL_NOT_VERIFIED_MESSAGE =
  "Please verify your email before continuing.";

export interface EmailSignInInput {
  email: string;
  password: string;
}

export interface EmailRegistrationInput extends EmailSignInInput {
  firstName: string;
  lastName: string;
}

export interface PasswordResetInput {
  oobCode: string;
  password: string;
}

function emailVerificationUrl(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}/verify-email`;
}

function passwordResetUrl(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}/reset-password`;
}

function fullName(input: EmailRegistrationInput): string {
  return `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
}

function isPasswordProviderUser(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === "password");
}

async function sendVerification(user: User): Promise<void> {
  const url = emailVerificationUrl();
  await sendEmailVerification(
    user,
    url
      ? {
          url,
          handleCodeInApp: true,
        }
      : undefined,
  );
  await recordAuditEventQuietly({
    type: "auth.emailVerificationSent",
    metadata: { email: user.email ?? null },
  });
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithPopup(auth, provider);
  await ensureUserProfile(credential.user);
  await recordAuditEventQuietly({
    type: "auth.login",
    metadata: { method: "google" },
  });
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

  if (!credential.user.emailVerified) {
    await ensureUserProfile(credential.user);
    await signOut(auth);
    throw new Error(EMAIL_NOT_VERIFIED_MESSAGE);
  }

  await ensureUserProfile(credential.user);
  await recordAuditEventQuietly({
    type: "auth.login",
    metadata: { method: "email" },
  });
  return credential;
}

export async function registerWithEmail(
  input: EmailRegistrationInput,
): Promise<UserCredential> {
  assertPasswordPolicy(input.password);

  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email.trim(),
    input.password,
  );

  await updateProfile(credential.user, { displayName: fullName(input) });
  await sendVerification(credential.user);
  await ensureUserProfile(credential.user);
  await signOut(auth);
  return credential;
}

export async function resendVerificationEmail(): Promise<void> {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw new Error("Sign in again before requesting a verification email.");
  }

  await sendVerification(user);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const url = passwordResetUrl();
  await sendPasswordResetEmail(
    getFirebaseAuth(),
    email.trim(),
    url
      ? {
          url,
          handleCodeInApp: true,
        }
      : undefined,
  );
  await recordAuditEventQuietly({
    type: "auth.passwordResetRequested",
    metadata: { email: email.trim().toLowerCase() },
  });
}

export async function verifyPasswordReset(oobCode: string): Promise<string> {
  return verifyPasswordResetCode(getFirebaseAuth(), oobCode);
}

export async function resetPassword(input: PasswordResetInput): Promise<void> {
  assertPasswordPolicy(input.password);
  await confirmPasswordReset(getFirebaseAuth(), input.oobCode, input.password);
}

export async function verifyEmail(oobCode: string): Promise<void> {
  await applyActionCode(getFirebaseAuth(), oobCode);
  await recordAuditEventQuietly({ type: "auth.emailVerificationCompleted" });
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (currentUser) {
    await recordAuditEventQuietly({
      type: "auth.logout",
      metadata: {
        email: currentUser.email ?? null,
        passwordProvider: isPasswordProviderUser(currentUser),
      },
    });
  }

  await signOut(auth);
}
