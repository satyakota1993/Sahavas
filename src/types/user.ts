import type { Timestamp } from "firebase/firestore";

export type UserProfileStatus =
  | "ACTIVE"
  | "EMAIL_PENDING_VERIFICATION"
  | "DISABLED"
  | "active"
  | "pending"
  | "disabled";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  linkedProviders: string[];
  status: UserProfileStatus;
  defaultSocietyId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
}
