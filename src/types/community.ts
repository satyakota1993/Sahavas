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

export interface CommunityConfiguration {
  communityId: string;
  communityConfig: CommunityConfig;
  brandingConfig: BrandingConfig;
  terminologyConfig: TerminologyConfig;
}

export interface UpdateCommunityConfigurationInput {
  communityId: string;
  communityConfig?: Partial<
    Pick<CommunityConfig, "timezone" | "locale" | "fiscalYearStartMonth">
  >;
  brandingConfig?: Partial<
    Pick<BrandingConfig, "displayName" | "logoUrl" | "primaryColor">
  >;
  terminologyConfig?: {
    labels?: Partial<TerminologyLabels>;
    hierarchyDepth?: number;
    usesFloors?: boolean;
  };
}

export interface CommunityConfigurationMutationResult {
  communityId: string;
  status: "updated";
}
