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
  group: string;
  timezone: string;
  locale: string;
  fiscalYearStartMonth: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BrandingConfig {
  communityId: string;
  configId: string;
  displayName: string;
  logoUrl?: string;
  primaryColor?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TerminologyConfig {
  communityId: string;
  configId: string;
  labels: TerminologyLabels;
  hierarchyDepth: number;
  usesFloors: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TerminologyLabels {
  community: string;
  propertyGroup: string;
  subGroup: string;
  floor: string;
  unit: string;
  resident: string;
  owner: string;
  tenant: string;
  committee: string;
  parkingSpace: string;
  facility: string;
  amenity: string;
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
