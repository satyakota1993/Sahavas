import type { Timestamp } from "firebase/firestore";

import type { UserRole } from "./roles";

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface SocietyInvite {
  id: string;
  communityId?: string;
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
  communityId?: string;
  societyId: string;
  token: string;
}

export interface AcceptInviteResult {
  communityId?: string;
  societyId: string;
  membershipId: string;
  status?: "accepted" | "already-member";
  roles?: UserRole[];
  primaryRole?: UserRole;
}
