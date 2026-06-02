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

interface UpdateCommunityConfigurationPayload {
  communityId?: unknown;
  communityConfig?: unknown;
  brandingConfig?: unknown;
  terminologyConfig?: unknown;
}

interface CommunityMutationResponse {
  communityId: string;
  membershipId?: string;
  status: "trial" | "active" | "suspended" | "archived";
}

interface CommunityConfigurationMutationResponse {
  communityId: string;
  status: "updated";
}

const callableOptions = {
  region: "asia-south1",
  enforceAppCheck: true,
};

const terminologyLabelKeys = [
  "community",
  "propertyGroup",
  "subGroup",
  "floor",
  "unit",
  "resident",
  "owner",
  "tenant",
  "committee",
  "parkingSpace",
  "facility",
  "amenity",
] as const;

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

function optionalObject(value: unknown, fieldName: string): Record<string, unknown> | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new HttpsError("invalid-argument", `${fieldName} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function hasField(source: Record<string, unknown>, fieldName: string): boolean {
  return Object.prototype.hasOwnProperty.call(source, fieldName);
}

function textPatch(
  source: Record<string, unknown>,
  fieldName: string,
  maxLength: number,
  options: { allowClear?: boolean; requiredWhenPresent?: boolean } = {},
): string | FirebaseFirestore.FieldValue | undefined {
  if (!hasField(source, fieldName)) {
    return undefined;
  }

  const value = source[fieldName];

  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${fieldName} must be text.`);
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    if (options.allowClear) {
      return FieldValue.delete();
    }

    if (options.requiredWhenPresent) {
      throw new HttpsError("invalid-argument", `${fieldName} cannot be empty.`);
    }

    return undefined;
  }

  if (trimmed.length > maxLength) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} must be ${maxLength} characters or less.`,
    );
  }

  return trimmed;
}

function integerPatch(
  source: Record<string, unknown>,
  fieldName: string,
  min: number,
  max: number,
): number | undefined {
  if (!hasField(source, fieldName)) {
    return undefined;
  }

  const value = source[fieldName];

  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} must be an integer between ${min} and ${max}.`,
    );
  }

  return value;
}

function booleanPatch(
  source: Record<string, unknown>,
  fieldName: string,
): boolean | undefined {
  if (!hasField(source, fieldName)) {
    return undefined;
  }

  const value = source[fieldName];

  if (typeof value !== "boolean") {
    throw new HttpsError("invalid-argument", `${fieldName} must be true or false.`);
  }

  return value;
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

export const updateCommunityConfiguration = onCall<UpdateCommunityConfigurationPayload>(
  callableOptions,
  async (request): Promise<CommunityConfigurationMutationResponse> => {
    const actor = requireAuth(request);
    const communityId = requiredText(request.data?.communityId, "communityId");
    validateCommunityId(communityId);
    await assertCanManageCommunity(communityId, actor.uid, "communities.update");

    const communityConfigPayload = optionalObject(
      request.data?.communityConfig,
      "communityConfig",
    );
    const brandingConfigPayload = optionalObject(
      request.data?.brandingConfig,
      "brandingConfig",
    );
    const terminologyConfigPayload = optionalObject(
      request.data?.terminologyConfig,
      "terminologyConfig",
    );

    const communityConfigUpdate: Record<string, unknown> = {};
    const brandingConfigUpdate: Record<string, unknown> = {};
    const terminologyConfigUpdate: Record<string, unknown> = {};
    const changedFields: string[] = [];

    if (communityConfigPayload) {
      const timezone = textPatch(communityConfigPayload, "timezone", 80, {
        requiredWhenPresent: true,
      });
      const locale = textPatch(communityConfigPayload, "locale", 20, {
        requiredWhenPresent: true,
      });
      const fiscalYearStartMonth = integerPatch(
        communityConfigPayload,
        "fiscalYearStartMonth",
        1,
        12,
      );

      if (timezone !== undefined) {
        communityConfigUpdate.timezone = timezone;
        changedFields.push("communityConfig.timezone");
      }

      if (locale !== undefined) {
        communityConfigUpdate.locale = locale;
        changedFields.push("communityConfig.locale");
      }

      if (fiscalYearStartMonth !== undefined) {
        communityConfigUpdate.fiscalYearStartMonth = fiscalYearStartMonth;
        changedFields.push("communityConfig.fiscalYearStartMonth");
      }
    }

    if (brandingConfigPayload) {
      const displayName = textPatch(brandingConfigPayload, "displayName", 120, {
        requiredWhenPresent: true,
      });
      const logoUrl = textPatch(brandingConfigPayload, "logoUrl", 500, {
        allowClear: true,
      });
      const primaryColor = textPatch(brandingConfigPayload, "primaryColor", 7, {
        allowClear: true,
      });

      if (displayName !== undefined) {
        brandingConfigUpdate.displayName = displayName;
        changedFields.push("brandingConfig.displayName");
      }

      if (typeof logoUrl === "string" && !/^https?:\/\//i.test(logoUrl)) {
        throw new HttpsError("invalid-argument", "logoUrl must be a valid web URL.");
      }

      if (logoUrl !== undefined) {
        brandingConfigUpdate.logoUrl = logoUrl;
        changedFields.push("brandingConfig.logoUrl");
      }

      if (
        typeof primaryColor === "string" &&
        !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)
      ) {
        throw new HttpsError("invalid-argument", "primaryColor must be a hex color.");
      }

      if (primaryColor !== undefined) {
        brandingConfigUpdate.primaryColor = primaryColor;
        changedFields.push("brandingConfig.primaryColor");
      }
    }

    if (terminologyConfigPayload) {
      const hierarchyDepth = integerPatch(
        terminologyConfigPayload,
        "hierarchyDepth",
        1,
        6,
      );
      const usesFloors = booleanPatch(terminologyConfigPayload, "usesFloors");
      const labelsPayload = optionalObject(terminologyConfigPayload.labels, "labels");
      const labelsUpdate: Record<string, string> = {};

      if (hierarchyDepth !== undefined) {
        terminologyConfigUpdate.hierarchyDepth = hierarchyDepth;
        changedFields.push("terminologyConfig.hierarchyDepth");
      }

      if (usesFloors !== undefined) {
        terminologyConfigUpdate.usesFloors = usesFloors;
        changedFields.push("terminologyConfig.usesFloors");
      }

      if (labelsPayload) {
        for (const labelKey of terminologyLabelKeys) {
          const label = textPatch(labelsPayload, labelKey, 40, {
            requiredWhenPresent: true,
          });

          if (typeof label === "string") {
            labelsUpdate[labelKey] = label;
            changedFields.push(`terminologyConfig.labels.${labelKey}`);
          }
        }
      }

      if (Object.keys(labelsUpdate).length > 0) {
        terminologyConfigUpdate.labels = labelsUpdate;
      }
    }

    if (changedFields.length === 0) {
      throw new HttpsError("invalid-argument", "At least one configuration field is required.");
    }

    const db = getFirestore();
    const communityRef = db.collection("communities").doc(communityId);
    const communityConfigRef = communityRef.collection("community_configs").doc("default");
    const brandingConfigRef = communityRef.collection("branding_configs").doc("default");
    const terminologyConfigRef = communityRef
      .collection("terminology_configs")
      .doc("default");

    await db.runTransaction(async (transaction) => {
      const [
        communitySnapshot,
        communityConfigSnapshot,
        brandingConfigSnapshot,
        terminologyConfigSnapshot,
      ] = await Promise.all([
        transaction.get(communityRef),
        transaction.get(communityConfigRef),
        transaction.get(brandingConfigRef),
        transaction.get(terminologyConfigRef),
      ]);

      if (!communitySnapshot.exists) {
        throw new HttpsError("not-found", "Community was not found.");
      }

      if (Object.keys(communityConfigUpdate).length > 0) {
        transaction.set(
          communityConfigRef,
          {
            communityId,
            group: "default",
            ...(communityConfigSnapshot.exists
              ? {}
              : { createdAt: FieldValue.serverTimestamp() }),
            ...communityConfigUpdate,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      if (Object.keys(brandingConfigUpdate).length > 0) {
        transaction.set(
          brandingConfigRef,
          {
            communityId,
            configId: "default",
            ...(brandingConfigSnapshot.exists
              ? {}
              : { createdAt: FieldValue.serverTimestamp() }),
            ...brandingConfigUpdate,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      if (Object.keys(terminologyConfigUpdate).length > 0) {
        transaction.set(
          terminologyConfigRef,
          {
            communityId,
            configId: "default",
            ...(terminologyConfigSnapshot.exists
              ? {}
              : { createdAt: FieldValue.serverTimestamp() }),
            ...terminologyConfigUpdate,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      writeSocietyAuditLog(transaction, {
        societyId: communityId,
        actorId: actor.uid,
        actorEmail: actor.email,
        action: "community.configurationUpdated",
        resourceType: "communityConfiguration",
        resourceId: communityId,
        metadata: {
          fields: changedFields.join(","),
        },
      });
    });

    return {
      communityId,
      status: "updated",
    };
  },
);
