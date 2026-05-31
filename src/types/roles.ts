export type UserRole =
  | "superAdmin"
  | "societyAdmin"
  | "resident"
  | "securityGuard"
  | "vendor";

export type MembershipStatus =
  | "active"
  | "invited"
  | "pending"
  | "suspended"
  | "removed";

export type CapabilityMap = Record<string, boolean>;
