import type { Timestamp } from "firebase/firestore";

import type { CapabilityMap, MembershipStatus, UserRole } from "./roles";
import type { Society } from "./society";

export interface Membership {
  id: string;
  userId: string;
  societyId: string;
  roles: UserRole[];
  primaryRole: UserRole;
  capabilities: CapabilityMap;
  status: MembershipStatus;
  unitIds: string[];
  invitedEmail?: string;
  displayName?: string;
  joinedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface MembershipWithSociety extends Membership {
  society: Society | null;
}

export interface RoleContext {
  userId: string;
  societyId: string;
  roles: UserRole[];
  primaryRole: UserRole;
  capabilities: CapabilityMap;
  activeMembership: MembershipWithSociety;
  can: (capability: string) => boolean;
}
