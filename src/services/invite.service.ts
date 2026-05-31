import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { getFirestoreDb } from "@/firebase/firestore";
import { getFirebaseFunctions } from "@/firebase/functions";
import { firestorePaths } from "@/firebase/paths";
import type {
  AcceptInvitePayload,
  AcceptInviteResult,
  SocietyInvite,
} from "@/types/invite";
import type { UserRole } from "@/types/roles";

type TimestampLike = {
  toMillis: () => number;
};

function hasToMillis(value: unknown): value is TimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as TimestampLike).toMillis === "function"
  );
}

function assertInviteNotExpired(invite: SocietyInvite): void {
  if (invite.status !== "pending") {
    throw new Error("This invite link is no longer active.");
  }

  if (hasToMillis(invite.expiresAt) && invite.expiresAt.toMillis() < Date.now()) {
    throw new Error("This invite link has expired.");
  }
}

export async function hashInviteToken(token: string): Promise<string> {
  if (!crypto.subtle) {
    throw new Error("Invite links require a secure browser context.");
  }

  const tokenBytes = new TextEncoder().encode(token.trim());
  const digest = await crypto.subtle.digest("SHA-256", tokenBytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getInviteByToken(
  societyId: string,
  token: string,
): Promise<SocietyInvite> {
  const tokenHash = await hashInviteToken(token);
  const inviteSnapshot = await getDoc(
    doc(getFirestoreDb(), firestorePaths.societyInvite(societyId, tokenHash)),
  );

  if (!inviteSnapshot.exists()) {
    throw new Error("Invite link was not found.");
  }

  const data = inviteSnapshot.data();
  const invite: SocietyInvite = {
    id: inviteSnapshot.id,
    societyId,
    email: data.email,
    phoneNumber: data.phoneNumber,
    roles: Array.isArray(data.roles) ? (data.roles as UserRole[]) : ["resident"],
    primaryRole: data.primaryRole ?? "resident",
    status: data.status ?? "pending",
    tokenHash,
    unitIds: Array.isArray(data.unitIds) ? data.unitIds : [],
    invitedBy: data.invitedBy,
    expiresAt: data.expiresAt,
    createdAt: data.createdAt,
    acceptedAt: data.acceptedAt,
  };

  assertInviteNotExpired(invite);
  return invite;
}

export async function acceptInvite(
  payload: AcceptInvitePayload,
): Promise<AcceptInviteResult> {
  const callable = httpsCallable<AcceptInvitePayload, AcceptInviteResult>(
    getFirebaseFunctions(),
    "acceptInvite",
  );
  const result = await callable(payload);
  return result.data;
}
