import type { Transaction } from "firebase-admin/firestore";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export interface AuditLogInput {
  societyId: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

export function writeSocietyAuditLog(
  transaction: Transaction,
  input: AuditLogInput,
): void {
  const auditRef = getFirestore()
    .collection("societies")
    .doc(input.societyId)
    .collection("auditLogs")
    .doc();
  const communityAuditRef = getFirestore()
    .collection("communities")
    .doc(input.societyId)
    .collection("auditLogs")
    .doc(auditRef.id);
  const auditData = {
    societyId: input.societyId,
    communityId: input.societyId,
    actorId: input.actorId,
    actorEmail: input.actorEmail ?? null,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    metadata: input.metadata ?? {},
    source: "cloudFunction",
    createdAt: FieldValue.serverTimestamp(),
  };

  transaction.create(auditRef, auditData);
  transaction.create(communityAuditRef, auditData);
}
