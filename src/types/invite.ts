import type { Timestamp } from "firebase/firestore";

import type { UserRole } from "./roles";

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface SocietyInvite {
  id: string;
  societyId: string;
  email?: string;
  phoneNumber?: string;
  roles: UserRole[];
  primaryRole: UserRole;
  status: InviteStatus;
  tokenHash: string;
  unitIds: string[];
  invitedBy: string;
  expiresAt: Timestamp;
  createdAt?: Timestamp;
  acceptedAt?: Timestamp;
}

export interface AcceptInvitePayload {
  societyId: string;
  token: string;
}

export interface AcceptInviteResult {
  societyId: string;
  membershipId: string;
}
