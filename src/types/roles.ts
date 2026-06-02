export type UserRole =
  | "platformAdmin"
  | "communityAdmin"
  | "president"
  | "secretary"
  | "treasurer"
  | "committeeMember"
  | "owner"
  | "resident"
  | "tenant"
  | "vendor"
  | "security"
  | "superAdmin"
  | "societyAdmin"
  | "securityGuard";

export type CanonicalUserRole =
  | "platformAdmin"
  | "communityAdmin"
  | "president"
  | "secretary"
  | "treasurer"
  | "committeeMember"
  | "owner"
  | "resident"
  | "tenant"
  | "vendor"
  | "security";

export type MembershipStatus =
  | "active"
  | "invited"
  | "pending"
  | "suspended"
  | "removed";

export type Permission =
  | "platform.manage"
  | "communities.create"
  | "communities.read"
  | "communities.update"
  | "members.read"
  | "members.write"
  | "memberships.read"
  | "invites.read"
  | "invites.write"
  | "residents.read"
  | "residents.write"
  | "visitors.read"
  | "visitors.write"
  | "complaints.read"
  | "complaints.write"
  | "notices.read"
  | "notices.write"
  | "maintenance.read"
  | "maintenance.write"
  | "audit.read";

export type CapabilityMap = Partial<Record<Permission | "*", boolean>> &
  Record<string, boolean | undefined>;

export const roleLabels: Record<CanonicalUserRole, string> = {
  platformAdmin: "Platform Admin",
  communityAdmin: "Community Admin",
  president: "President",
  secretary: "Secretary",
  treasurer: "Treasurer",
  committeeMember: "Committee Member",
  owner: "Owner",
  resident: "Resident",
  tenant: "Tenant",
  vendor: "Vendor",
  security: "Security",
};

export const roleAliases: Partial<Record<UserRole, CanonicalUserRole>> = {
  superAdmin: "platformAdmin",
  societyAdmin: "communityAdmin",
  securityGuard: "security",
};

export const rolePermissions: Record<CanonicalUserRole, Permission[]> = {
  platformAdmin: [
    "platform.manage",
    "communities.create",
    "communities.read",
    "communities.update",
    "members.read",
    "members.write",
    "memberships.read",
    "invites.read",
    "invites.write",
    "residents.read",
    "residents.write",
    "visitors.read",
    "visitors.write",
    "complaints.read",
    "complaints.write",
    "notices.read",
    "notices.write",
    "maintenance.read",
    "maintenance.write",
    "audit.read",
  ],
  communityAdmin: [
    "communities.read",
    "communities.update",
    "members.read",
    "members.write",
    "memberships.read",
    "invites.read",
    "invites.write",
    "residents.read",
    "residents.write",
    "visitors.read",
    "visitors.write",
    "complaints.read",
    "complaints.write",
    "notices.read",
    "notices.write",
    "maintenance.read",
    "maintenance.write",
    "audit.read",
  ],
  president: [
    "communities.read",
    "communities.update",
    "members.read",
    "members.write",
    "invites.read",
    "residents.read",
    "residents.write",
    "visitors.read",
    "complaints.read",
    "complaints.write",
    "notices.read",
    "notices.write",
    "maintenance.read",
    "audit.read",
  ],
  secretary: [
    "communities.read",
    "members.read",
    "members.write",
    "invites.read",
    "residents.read",
    "residents.write",
    "visitors.read",
    "complaints.read",
    "complaints.write",
    "notices.read",
    "notices.write",
    "maintenance.read",
    "audit.read",
  ],
  treasurer: [
    "communities.read",
    "members.read",
    "residents.read",
    "maintenance.read",
    "maintenance.write",
    "audit.read",
  ],
  committeeMember: [
    "communities.read",
    "members.read",
    "residents.read",
    "visitors.read",
    "complaints.read",
    "complaints.write",
    "notices.read",
    "maintenance.read",
  ],
  owner: [
    "communities.read",
    "residents.read",
    "visitors.read",
    "visitors.write",
    "complaints.read",
    "complaints.write",
    "notices.read",
    "maintenance.read",
  ],
  resident: [
    "communities.read",
    "visitors.read",
    "visitors.write",
    "complaints.read",
    "complaints.write",
    "notices.read",
    "maintenance.read",
  ],
  tenant: [
    "communities.read",
    "visitors.read",
    "visitors.write",
    "complaints.read",
    "complaints.write",
    "notices.read",
    "maintenance.read",
  ],
  vendor: ["communities.read", "notices.read"],
  security: ["communities.read", "visitors.read", "visitors.write"],
};

export function normalizeRole(role: UserRole): CanonicalUserRole {
  return roleAliases[role] ?? (role as CanonicalUserRole);
}

export function hasPlatformRole(roles: UserRole[]): boolean {
  return roles.map(normalizeRole).includes("platformAdmin");
}

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[normalizeRole(role)].includes(permission);
}

export function rolesHavePermission(
  roles: UserRole[],
  permission: Permission,
  capabilities: CapabilityMap = {},
): boolean {
  return (
    capabilities["*"] === true ||
    capabilities[permission] === true ||
    roles.some((role) => roleHasPermission(role, permission))
  );
}
