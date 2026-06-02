import { doc, getDoc } from "firebase/firestore";

import { getFirestoreDb } from "@/firebase/firestore";
import { firestorePaths } from "@/firebase/paths";
import type { TerminologyConfig, TerminologyLabels } from "@/types/community";

export const defaultTerminologyLabels: TerminologyLabels = {
  community: "Community",
  propertyGroup: "Section",
  subGroup: "Subsection",
  floor: "Level",
  unit: "Residence",
  resident: "Member",
  owner: "Owner",
  tenant: "Tenant",
  committee: "Committee",
  parkingSpace: "Parking Space",
  facility: "Facility",
  amenity: "Amenity",
};

function normalizeLabels(value: unknown): TerminologyLabels {
  if (!value || typeof value !== "object") {
    return defaultTerminologyLabels;
  }

  const labels = value as Partial<Record<keyof TerminologyLabels, unknown>>;

  return Object.entries(defaultTerminologyLabels).reduce<TerminologyLabels>(
    (resolved, [key, fallback]) => {
      const label = labels[key as keyof TerminologyLabels];
      resolved[key as keyof TerminologyLabels] =
        typeof label === "string" && label.trim().length > 0 ? label.trim() : fallback;
      return resolved;
    },
    { ...defaultTerminologyLabels },
  );
}

export function resolveTerminologyLabel(
  labels: Partial<TerminologyLabels> | null | undefined,
  key: keyof TerminologyLabels,
): string {
  return labels?.[key] ?? defaultTerminologyLabels[key];
}

export async function getTerminologyConfig(
  communityId: string,
): Promise<TerminologyConfig> {
  const snapshot = await getDoc(
    doc(getFirestoreDb(), firestorePaths.terminologyConfig(communityId)),
  );

  if (!snapshot.exists()) {
    return {
      communityId,
      configId: "default",
      labels: defaultTerminologyLabels,
      hierarchyDepth: 1,
      usesFloors: true,
    };
  }

  const data = snapshot.data();

  return {
    communityId,
    configId: snapshot.id,
    labels: normalizeLabels(data.labels),
    hierarchyDepth:
      typeof data.hierarchyDepth === "number" ? data.hierarchyDepth : 1,
    usesFloors: typeof data.usesFloors === "boolean" ? data.usesFloors : true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
