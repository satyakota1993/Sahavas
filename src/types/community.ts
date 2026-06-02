import type { Timestamp } from "firebase/firestore";

export type CommunityStatus = "trial" | "active" | "suspended" | "archived";

export interface Community {
  id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  country: string;
  status: CommunityStatus;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CommunityConfig {
  communityId: string;
  timezone: string;
  locale: string;
  fiscalYearStartMonth: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BrandingConfig {
  communityId: string;
  displayName: string;
  logoUrl?: string;
  primaryColor?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TerminologyConfig {
  communityId: string;
  communityLabel: string;
  unitLabel: string;
  residentLabel: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateCommunityInput {
  name: string;
  code?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface UpdateCommunityInput {
  communityId: string;
  name?: string;
  code?: string;
  city?: string;
  state?: string;
  status?: CommunityStatus;
}

export interface CommunityMutationResult {
  communityId: string;
  membershipId?: string;
  status: CommunityStatus;
}
