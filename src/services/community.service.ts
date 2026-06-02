import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { getFirestoreDb } from "@/firebase/firestore";
import { getFirebaseFunctions } from "@/firebase/functions";
import { firestorePaths } from "@/firebase/paths";
import type {
  Community,
  CommunityMutationResult,
  CreateCommunityInput,
  UpdateCommunityInput,
} from "@/types/community";

function normalizeCommunity(snapshotId: string, data: Record<string, unknown>): Community {
  return {
    id: snapshotId,
    name: typeof data.name === "string" ? data.name : "Unnamed community",
    code: typeof data.code === "string" ? data.code : undefined,
    city: typeof data.city === "string" ? data.city : undefined,
    state: typeof data.state === "string" ? data.state : undefined,
    country: typeof data.country === "string" ? data.country : "IN",
    status:
      data.status === "trial" ||
      data.status === "active" ||
      data.status === "suspended" ||
      data.status === "archived"
        ? data.status
        : "trial",
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: data.createdAt as Community["createdAt"],
    updatedAt: data.updatedAt as Community["updatedAt"],
  };
}

export async function createCommunity(
  input: CreateCommunityInput,
): Promise<CommunityMutationResult> {
  const callable = httpsCallable<CreateCommunityInput, CommunityMutationResult>(
    getFirebaseFunctions(),
    "createCommunity",
  );
  const result = await callable(input);
  return result.data;
}

export async function getCommunity(communityId: string): Promise<Community | null> {
  const communitySnapshot = await getDoc(
    doc(getFirestoreDb(), firestorePaths.community(communityId)),
  );

  if (!communitySnapshot.exists()) {
    return null;
  }

  return normalizeCommunity(communitySnapshot.id, communitySnapshot.data());
}

export async function updateCommunity(
  input: UpdateCommunityInput,
): Promise<CommunityMutationResult> {
  const callable = httpsCallable<UpdateCommunityInput, CommunityMutationResult>(
    getFirebaseFunctions(),
    "updateCommunity",
  );
  const result = await callable(input);
  return result.data;
}
