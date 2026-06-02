import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { getFirestoreDb } from "@/firebase/firestore";
import { getFirebaseFunctions } from "@/firebase/functions";
import { firestorePaths } from "@/firebase/paths";
import {
  defaultTerminologyLabels,
  getTerminologyConfig,
} from "@/services/terminology.service";
import type {
  BrandingConfig,
  CommunityConfig,
  CommunityConfiguration,
  CommunityConfigurationMutationResult,
  UpdateCommunityConfigurationInput,
} from "@/types/community";

function normalizeCommunityConfig(
  communityId: string,
  data: Record<string, unknown> | null,
): CommunityConfig {
  return {
    communityId,
    group: typeof data?.group === "string" ? data.group : "default",
    timezone: typeof data?.timezone === "string" ? data.timezone : "Asia/Kolkata",
    locale: typeof data?.locale === "string" ? data.locale : "en-IN",
    fiscalYearStartMonth:
      typeof data?.fiscalYearStartMonth === "number" ? data.fiscalYearStartMonth : 4,
    createdAt: data?.createdAt as CommunityConfig["createdAt"],
    updatedAt: data?.updatedAt as CommunityConfig["updatedAt"],
  };
}

function normalizeBrandingConfig(
  communityId: string,
  data: Record<string, unknown> | null,
): BrandingConfig {
  return {
    communityId,
    configId: typeof data?.configId === "string" ? data.configId : "default",
    displayName:
      typeof data?.displayName === "string" && data.displayName.trim().length > 0
        ? data.displayName.trim()
        : "Sahavas Community",
    logoUrl:
      typeof data?.logoUrl === "string" && data.logoUrl.trim().length > 0
        ? data.logoUrl.trim()
        : undefined,
    primaryColor:
      typeof data?.primaryColor === "string" && data.primaryColor.trim().length > 0
        ? data.primaryColor.trim()
        : undefined,
    createdAt: data?.createdAt as BrandingConfig["createdAt"],
    updatedAt: data?.updatedAt as BrandingConfig["updatedAt"],
  };
}

export async function getCommunityConfiguration(
  communityId: string,
): Promise<CommunityConfiguration> {
  const db = getFirestoreDb();
  const [communityConfigSnapshot, brandingConfigSnapshot, terminologyConfig] =
    await Promise.all([
      getDoc(doc(db, firestorePaths.communityConfig(communityId))),
      getDoc(doc(db, firestorePaths.brandingConfig(communityId))),
      getTerminologyConfig(communityId),
    ]);

  return {
    communityId,
    communityConfig: normalizeCommunityConfig(
      communityId,
      communityConfigSnapshot.exists() ? communityConfigSnapshot.data() : null,
    ),
    brandingConfig: normalizeBrandingConfig(
      communityId,
      brandingConfigSnapshot.exists() ? brandingConfigSnapshot.data() : null,
    ),
    terminologyConfig: {
      ...terminologyConfig,
      labels: {
        ...defaultTerminologyLabels,
        ...terminologyConfig.labels,
      },
    },
  };
}

export async function updateCommunityConfiguration(
  input: UpdateCommunityConfigurationInput,
): Promise<CommunityConfigurationMutationResult> {
  const callable = httpsCallable<
    UpdateCommunityConfigurationInput,
    CommunityConfigurationMutationResult
  >(getFirebaseFunctions(), "updateCommunityConfiguration");
  const result = await callable(input);
  return result.data;
}
