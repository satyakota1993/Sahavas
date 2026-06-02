import { createHash } from "node:crypto";

import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { requireAuth } from "../auth/requireAuth";
import { writeSocietyAuditLog } from "../audit/writeAuditLog";
import {
  capabilitiesForRoles,
  resolvePrimaryRole,
  sanitizeInviteRoles,
  type UserRole,
} from "./roles";

interface AcceptInvitePayload {
  communityId?: unknown;
  societyId?: unknown;
  token?: unknown;
}

interface AcceptInviteResponse {
  societyId: string;
  membershipId: string;
  status: "accepted" | "already-member";
  roles: UserRole[];
  primaryRole: UserRole;
}

const callableOptions = {
  region: "asia-south1",
  enforceAppCheck: true,
};

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", `${fieldName} is required.`);
  }

  return value.trim();
}

function validateSocietyId(societyId: string): void {
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(societyId)) {
    throw new HttpsError("invalid-argument", "Invalid society id.");
  }
}

function validateInviteToken(token: string): void {
  if (token.length < 16 || token.length > 512) {
    throw new HttpsError("invalid-argument", "Invalid invite token.");
  }
}

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().toLowerCase()
    : null;
}

function requireFutureExpiry(value: unknown): void {
  if (!(value instanceof Timestamp)) {
    throw new HttpsError("failed-precondition", "Invite expiry is invalid.");
  }

  if (value.toMillis() <= Date.now()) {
    throw new HttpsError("failed-precondition", "This invite link has expired.");
  }
}

function assertInvitePending(status: unknown): void {
  if (status === "revoked") {
    throw new HttpsError("failed-precondition", "This invite link has been revoked.");
  }

  if (status === "accepted") {
    throw new HttpsError("already-exists", "This invite link has already been accepted.");
  }

  if (status !== "pending") {
    throw new HttpsError("failed-precondition", "This invite link is no longer active.");
  }
}

function assertSocietyCanAcceptInvites(status: unknown): void {
  const normalizedStatus = typeof status === "string" ? status : "active";

  if (!["active", "trial"].includes(normalizedStatus)) {
    throw new HttpsError(
      "failed-precondition",
      "This society is not accepting new memberships.",
    );
  }
}

function membershipDocumentId(uid: string, societyId: string): string {
  return `${uid}_${societyId}`;
}

function acceptedInvitePatch(actorUid: string, membershipId: string) {
  return {
    status: "accepted",
    acceptedBy: actorUid,
    acceptedAt: FieldValue.serverTimestamp(),
    membershipId,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export const acceptInvite = onCall<AcceptInvitePayload>(
  callableOptions,
  async (request): Promise<AcceptInviteResponse> => {
    const actor = requireAuth(request);
    const societyId = requireNonEmptyString(
      request.data?.communityId ?? request.data?.societyId,
      "communityId",
    );
    const token = requireNonEmptyString(request.data?.token, "token");

    validateSocietyId(societyId);
    validateInviteToken(token);

    const tokenHash = hashInviteToken(token);
    const db = getFirestore();
    const communityRef = db.collection("communities").doc(societyId);
    const societyRef = db.collection("societies").doc(societyId);
    const communityInviteRef = communityRef.collection("invites").doc(tokenHash);
    const societyInviteRef = societyRef.collection("invites").doc(tokenHash);
    const membershipId = membershipDocumentId(actor.uid, societyId);
    const membershipRef = db.collection("memberships").doc(membershipId);
    const communityMemberRef = communityRef.collection("members").doc(actor.uid);
    const societyMemberRef = societyRef.collection("members").doc(actor.uid);

    return db.runTransaction(async (transaction) => {
      const [
        communitySnapshot,
        societySnapshot,
        communityInviteSnapshot,
        societyInviteSnapshot,
        membershipSnapshot,
        communityMemberSnapshot,
        societyMemberSnapshot,
      ] = await Promise.all([
        transaction.get(communityRef),
        transaction.get(societyRef),
        transaction.get(communityInviteRef),
        transaction.get(societyInviteRef),
        transaction.get(membershipRef),
        transaction.get(communityMemberRef),
        transaction.get(societyMemberRef),
      ]);

      if (!communitySnapshot.exists && !societySnapshot.exists) {
        throw new HttpsError("not-found", "Community was not found.");
      }

      const society = communitySnapshot.data() ?? societySnapshot.data() ?? {};
      assertSocietyCanAcceptInvites(society.status);

      const inviteSnapshot = communityInviteSnapshot.exists
        ? communityInviteSnapshot
        : societyInviteSnapshot;
      const inviteRefsToUpdate = [
        communityInviteSnapshot.exists ? communityInviteRef : null,
        societyInviteSnapshot.exists ? societyInviteRef : null,
      ].filter((ref): ref is FirebaseFirestore.DocumentReference => ref !== null);

      if (!inviteSnapshot.exists) {
        throw new HttpsError("not-found", "Invite link was not found.");
      }

      const invite = inviteSnapshot.data() ?? {};
      assertInvitePending(invite.status);
      requireFutureExpiry(invite.expiresAt);

      if (typeof invite.societyId === "string" && invite.societyId !== societyId) {
        throw new HttpsError("permission-denied", "Invite society mismatch.");
      }

      const inviteEmail = normalizeEmail(invite.email);
      const actorEmail = normalizeEmail(actor.email);

      if (inviteEmail && inviteEmail !== actorEmail) {
        throw new HttpsError(
          "permission-denied",
          "Signed-in account does not match this invite.",
        );
      }

      const roles = sanitizeInviteRoles(invite.roles);
      const primaryRole = resolvePrimaryRole(invite.primaryRole, roles);
      const unitIds = Array.isArray(invite.unitIds) ? invite.unitIds : [];
      const capabilities = capabilitiesForRoles(roles);
      const existingMembership = membershipSnapshot.exists
        ? membershipSnapshot.data()
        : null;
      const existingMember = communityMemberSnapshot.exists
        ? communityMemberSnapshot.data()
        : societyMemberSnapshot.data();
      const existingStatus = existingMembership?.status ?? existingMember?.status;

      if (existingStatus === "suspended" || existingStatus === "removed") {
        throw new HttpsError(
          "failed-precondition",
          "This account cannot accept a new invite for the society.",
        );
      }

      const membershipData = {
        userId: actor.uid,
        communityId: societyId,
        societyId,
        roles,
        primaryRole,
        capabilities,
        status: "active",
        unitIds,
        invitedEmail: inviteEmail,
        displayName: actor.name ?? actor.email ?? null,
        inviteId: inviteSnapshot.id,
        invitedBy: invite.invitedBy ?? null,
        joinedAt: FieldValue.serverTimestamp(),
        createdAt: existingMembership?.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (existingStatus === "active") {
        for (const inviteRef of inviteRefsToUpdate) {
          transaction.update(inviteRef, acceptedInvitePatch(actor.uid, membershipId));
        }

        writeSocietyAuditLog(transaction, {
          societyId,
          actorId: actor.uid,
          actorEmail: actor.email,
          action: "membership.acceptInvite.alreadyMember",
          resourceType: "membership",
          resourceId: membershipId,
          metadata: {
            inviteId: inviteSnapshot.id,
            roles,
            primaryRole,
          },
        });

        return {
          societyId,
          membershipId,
          status: "already-member",
          roles,
          primaryRole,
        };
      }

      if (existingMembership || existingMember) {
        transaction.set(membershipRef, membershipData, { merge: true });
        transaction.set(communityMemberRef, membershipData, { merge: true });
        transaction.set(societyMemberRef, membershipData, { merge: true });
        for (const inviteRef of inviteRefsToUpdate) {
          transaction.update(inviteRef, acceptedInvitePatch(actor.uid, membershipId));
        }

        writeSocietyAuditLog(transaction, {
          societyId,
          actorId: actor.uid,
          actorEmail: actor.email,
          action: "membership.acceptInvite.activatedExisting",
          resourceType: "membership",
          resourceId: membershipId,
          metadata: {
            inviteId: inviteSnapshot.id,
            roles,
            primaryRole,
            unitIds,
          },
        });
        writeSocietyAuditLog(transaction, {
          societyId,
          actorId: actor.uid,
          actorEmail: actor.email,
          action: "membership.roleAssigned",
          resourceType: "membership",
          resourceId: membershipId,
          metadata: {
            inviteId: inviteSnapshot.id,
            roles,
            primaryRole,
          },
        });

        return {
          societyId,
          membershipId,
          status: "accepted",
          roles,
          primaryRole,
        };
      }

      transaction.create(membershipRef, membershipData);
      transaction.create(communityMemberRef, membershipData);
      transaction.create(societyMemberRef, membershipData);
      for (const inviteRef of inviteRefsToUpdate) {
        transaction.update(inviteRef, acceptedInvitePatch(actor.uid, membershipId));
      }

      writeSocietyAuditLog(transaction, {
        societyId,
        actorId: actor.uid,
        actorEmail: actor.email,
        action: "membership.acceptInvite",
        resourceType: "membership",
        resourceId: membershipId,
        metadata: {
          inviteId: inviteSnapshot.id,
          roles,
          primaryRole,
          unitIds,
        },
      });
      writeSocietyAuditLog(transaction, {
        societyId,
        actorId: actor.uid,
        actorEmail: actor.email,
        action: "membership.roleAssigned",
        resourceType: "membership",
        resourceId: membershipId,
        metadata: {
          inviteId: inviteSnapshot.id,
          roles,
          primaryRole,
        },
      });

      return {
        societyId,
        membershipId,
        status: "accepted",
        roles,
        primaryRole,
      };
    });
  },
);
