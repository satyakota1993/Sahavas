import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { getFirestoreDb } from "@/firebase/firestore";
import { firestorePaths } from "@/firebase/paths";
import type { UserProfile } from "@/types/user";

function providerIdsFor(user: User): string[] {
  return user.providerData.map((provider) => provider.providerId);
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(getFirestoreDb(), firestorePaths.user(user.uid));
  const existingProfile = await getDoc(userRef);
  const profilePatch = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
    emailVerified: user.emailVerified,
    phoneVerified: Boolean(user.phoneNumber),
    linkedProviders: providerIdsFor(user),
    status: "active",
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };

  await setDoc(
    userRef,
    existingProfile.exists()
      ? profilePatch
      : {
          ...profilePatch,
          createdAt: serverTimestamp(),
        },
    { merge: true },
  );

  const refreshedProfile = await getDoc(userRef);
  return refreshedProfile.data() as UserProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(getFirestoreDb(), firestorePaths.user(uid)));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}
