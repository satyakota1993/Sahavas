import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

const callableOptions = {
  region: "asia-south1",
};

const allowedAuthEvents = new Set([
  "auth.login",
  "auth.logout",
  "auth.passwordResetRequested",
  "auth.emailVerificationSent",
  "auth.emailVerificationCompleted",
]);

interface RecordAuditEventPayload {
  type?: unknown;
  communityId?: unknown;
  metadata?: unknown;
}

function cleanMetadata(value: unknown): Record<string, string | number | boolean | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, string | number | boolean | null>
  >((metadata, [key, rawValue]) => {
    if (
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean" ||
      rawValue === null
    ) {
      metadata[key] = rawValue;
    }

    return metadata;
  }, {});
}

export const recordAuditEvent = onCall<RecordAuditEventPayload>(
  callableOptions,
  async (request): Promise<{ ok: boolean }> => {
    const eventType = request.data?.type;

    if (typeof eventType !== "string" || !allowedAuthEvents.has(eventType)) {
      throw new HttpsError("invalid-argument", "Unsupported audit event.");
    }

    const actorId = request.auth?.uid ?? null;
    const actorEmail =
      typeof request.auth?.token.email === "string" ? request.auth.token.email : null;
    const db = getFirestore();

    await db.collection("platformAuditLogs").add({
      actorId,
      actorEmail,
      action: eventType,
      resourceType: "auth",
      resourceId: actorId ?? "anonymous",
      communityId:
        typeof request.data?.communityId === "string" ? request.data.communityId : null,
      metadata: cleanMetadata(request.data?.metadata),
      source: "clientCallable",
      createdAt: FieldValue.serverTimestamp(),
    });

    return { ok: true };
  },
);
