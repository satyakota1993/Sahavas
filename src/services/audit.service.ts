import { httpsCallable } from "firebase/functions";

import { getFirebaseFunctions } from "@/firebase/functions";

export type AuditEventType =
  | "auth.login"
  | "auth.logout"
  | "auth.passwordResetRequested"
  | "auth.emailVerificationSent"
  | "auth.emailVerificationCompleted"
  | "community.created"
  | "membership.roleAssigned";

export interface AuditEventPayload {
  type: AuditEventType;
  communityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export async function recordAuditEvent(payload: AuditEventPayload): Promise<void> {
  const callable = httpsCallable<AuditEventPayload, { ok: boolean }>(
    getFirebaseFunctions(),
    "recordAuditEvent",
  );
  await callable(payload);
}

export async function recordAuditEventQuietly(
  payload: AuditEventPayload,
): Promise<void> {
  try {
    await recordAuditEvent(payload);
  } catch {
    // Audit failures should not block login/logout UX. Server-side privileged
    // actions still write audit records inside their own transactions.
  }
}
