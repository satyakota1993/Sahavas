import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { writeSocietyAuditLog } from "../audit/writeAuditLog";
import { requireAuth } from "../auth/requireAuth";
import {
  capabilitiesForRoles,
  rolesHavePermission,
  type CanonicalUserRole,
  type Permission,
  type UserRole,
} from "../membership/roles";

interface CreateCommunityPayload {
  name?: unknown;
  code?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
}

interface UpdateCommunityPayload {
  communityId?: unknown;
  name?: unknown;
  code?: unknown;
  city?: unknown;
  state?: unknown;
  status?: unknown;
}

interface CommunityMutationResponse {
  communityId: string;
  membershipId?: string;
  status: "trial" | "active" | "suspended" | "archived";
}

const callableOptions = {
  region: "asia-south1",
  enforceAppCheck: true,
};

function requiredText(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", `${fieldName} is required.`);
  }

  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function validateCommunityId(communityId: string): void {
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(communityId)) {
    throw new HttpsError("invalid-argument", "Invalid community id.");
  }
}

function slugFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "community";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

function membershipDocumentId(uid: string, communityId: string): string {
  return `${uid}_${communityId}`;
}

async function assertCanManageCommunity(
  communityId: string,
  uid: string,
  permission: Permission,
): Promise<void> {
  const memberSnapshot = await getFirestore()
    .collection("communities")
    .doc(communityId)
    .collection("members")
    .doc(uid)
    .get();

  if (!memberSnapshot.exists) {
    throw new HttpsError("permission-denied", "Community membership is required.");
  }

  const member = memberSnapshot.data() ?? {};
  const roles = Array.isArray(member.roles) ? (member.roles as UserRole[]) : [];
  const capabilities =
    member.capabilities && typeof member.capabilities === "object"
      ? (member.capabilities as Record<string, boolean>)
      : {};

  if (member.status !== "active" || !rolesHavePermission(roles, permission, capabilities)) {
    throw new HttpsError("permission-denied", "Insufficient community permission.");
  }
}

export const createCommunity = onCall<CreateCommunityPayload>(
  callableOptions,
  async (request): Promise<CommunityMutationResponse> => {
    const actor = requireAuth(request);

    if (request.auth?.token.email_verified !== true) {
      throw new HttpsError("failed-precondition", "Email verification is required.");
    }

    const name = requiredText(request.data?.name, "name");
    const communityId = `${slugFromName(name)}-${randomSuffix()}`;
    const membershipId = membershipDocumentId(actor.uid, communityId);
    const db = getFirestore();
    const communityRef = db.collection("communities").doc(communityId);
    const societyRef = db.collection("societies").doc(communityId);
    const membershipRef = db.collection("memberships").doc(membershipId);
    const communityMemberRef = communityRef.collection("members").doc(actor.uid);
    const societyMemberRef = societyRef.collection("members").doc(actor.uid);
    const roles: CanonicalUserRole[] = ["communityAdmin"];
    const capabilities = capabilitiesForRoles(roles);
    const communityData = {
      name,
      code: optionalText(request.data?.code),
      city: optionalText(request.data?.city),
      state: optionalText(request.data?.state),
      country: optionalText(request.data?.country) ?? "IN",
      status: "trial",
      createdBy: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    const membershipData = {
      userId: actor.uid,
      communityId,
      societyId: communityId,
      roles,
      primaryRole: "communityAdmin",
      capabilities,
      status: "active",
      unitIds: [],
      displayName: actor.name ?? actor.email ?? null,
      joinedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.runTransaction(async (transaction) => {
      transaction.create(communityRef, communityData);
      transaction.create(societyRef, communityData);
      transaction.create(communityRef.collection("community_configs").doc("default"), {
        communityId,
        group: "default",
        timezone: "Asia/Kolkata",
        locale: "en-IN",
        fiscalYearStartMonth: 4,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(communityRef.collection("branding_configs").doc("default"), {
        communityId,
        configId: "default",
        displayName: name,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(communityRef.collection("terminology_configs").doc("default"), {
        communityId,
        configId: "default",
        labels: {
          community: "Community",
          propertyGroup: "Section",
          subGroup: "Subsection",
          floor: "Level",
          unit: "Residence",
          resident: "Member",
          owner: "Owner",
          tenant: "Tenant",
          committee: "Committee",
          parkingSpace: "Parking Space",
          facility: "Facility",
          amenity: "Amenity",
        },
        hierarchyDepth: 1,
        usesFloors: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(membershipRef, membershipData);
      transaction.create(communityMemberRef, membershipData);
      transaction.create(societyMemberRef, membershipData);

      writeSocietyAuditLog(transaction, {
        societyId: communityId,
        actorId: actor.uid,
        actorEmail: actor.email,
        action: "community.created",
        resourceType: "community",
        resourceId: communityId,
        metadata: { name },
      });

      writeSocietyAuditLog(transaction, {
        societyId: communityId,
        actorId: actor.uid,
        actorEmail: actor.email,
        action: "membership.roleAssigned",
        resourceType: "membership",
        resourceId: membershipId,
        metadata: { roles },
      });
    });

    return {
      communityId,
      membershipId,
      status: "trial",
    };
  },
);

export const updateCommunity = onCall<UpdateCommunityPayload>(
  callableOptions,
  async (request): Promise<CommunityMutationResponse> => {
    const actor = requireAuth(request);
    const communityId = requiredText(request.data?.communityId, "communityId");
    validateCommunityId(communityId);
    await assertCanManageCommunity(communityId, actor.uid, "communities.update");

    const update: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    const name = optionalText(request.data?.name);
    const code = optionalText(request.data?.code);
    const city = optionalText(request.data?.city);
    const state = optionalText(request.data?.state);

    if (name) {
      update.name = name;
    }

    if (code) {
      update.code = code;
    }

    if (city) {
      update.city = city;
    }

    if (state) {
      update.state = state;
    }

    if (
      request.data?.status === "trial" ||
      request.data?.status === "active" ||
      request.data?.status === "suspended" ||
      request.data?.status === "archived"
    ) {
      update.status = request.data.status;
    }

    const db = getFirestore();
    const communityRef = db.collection("communities").doc(communityId);
    const societyRef = db.collection("societies").doc(communityId);

    await db.runTransaction(async (transaction) => {
      const communitySnapshot = await transaction.get(communityRef);

      if (!communitySnapshot.exists) {
        throw new HttpsError("not-found", "Community was not found.");
      }

      transaction.update(communityRef, update);
      transaction.set(societyRef, update, { merge: true });
      writeSocietyAuditLog(transaction, {
        societyId: communityId,
        actorId: actor.uid,
        actorEmail: actor.email,
        action: "community.updated",
        resourceType: "community",
        resourceId: communityId,
        metadata: {
          fields: Object.keys(update).filter((field) => field !== "updatedAt").join(","),
        },
      });
    });

    return {
      communityId,
      status:
        request.data?.status === "active" ||
        request.data?.status === "suspended" ||
        request.data?.status === "archived"
          ? request.data.status
          : "trial",
    };
  },
);
