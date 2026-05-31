import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { getFirestoreDb } from "@/firebase/firestore";
import { firestorePaths } from "@/firebase/paths";
import type { Membership, MembershipWithSociety } from "@/types/membership";
import type { UserRole } from "@/types/roles";
import type { Society } from "@/types/society";

function normalizeRoles(data: DocumentData): UserRole[] {
  if (Array.isArray(data.roles) && data.roles.length > 0) {
    return data.roles as UserRole[];
  }

  if (typeof data.role === "string") {
    return [data.role as UserRole];
  }

  return ["resident"];
}

function normalizeMembership(snapshot: QueryDocumentSnapshot<DocumentData>): Membership {
  const data = snapshot.data();
  const roles = normalizeRoles(data);

  return {
    id: snapshot.id,
    userId: data.userId,
    societyId: data.societyId,
    roles,
    primaryRole: data.primaryRole ?? roles[0],
    capabilities: data.capabilities ?? {},
    status: data.status ?? "active",
    unitIds: Array.isArray(data.unitIds) ? data.unitIds : [],
    invitedEmail: data.invitedEmail,
    displayName: data.displayName,
    joinedAt: data.joinedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function getSocietyById(societyId: string): Promise<Society | null> {
  const snapshot = await getDoc(doc(getFirestoreDb(), firestorePaths.society(societyId)));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name ?? "Unnamed society",
    code: data.code,
    city: data.city,
    state: data.state,
    status: data.status ?? "active",
    planId: data.planId,
    billingStatus: data.billingStatus,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getActiveMemberships(
  userId: string,
): Promise<MembershipWithSociety[]> {
  const membershipsQuery = query(
    collection(getFirestoreDb(), firestorePaths.memberships),
    where("userId", "==", userId),
    where("status", "==", "active"),
  );
  const membershipSnapshots = await getDocs(membershipsQuery);
  const memberships = membershipSnapshots.docs.map(normalizeMembership);

  return Promise.all(
    memberships.map(async (membership) => ({
      ...membership,
      society: await getSocietyById(membership.societyId),
    })),
  );
}
