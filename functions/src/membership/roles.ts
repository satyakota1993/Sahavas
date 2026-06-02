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

export type CanonicalUserRole = Exclude<
  UserRole,
  "superAdmin" | "societyAdmin" | "securityGuard"
>;

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

const roleAliases: Partial<Record<UserRole, CanonicalUserRole>> = {
  superAdmin: "platformAdmin",
  societyAdmin: "communityAdmin",
  securityGuard: "security",
};

const allowedInviteRoles: UserRole[] = [
  "communityAdmin",
  "president",
  "secretary",
  "treasurer",
  "committeeMember",
  "owner",
  "resident",
  "tenant",
  "vendor",
  "security",
  "societyAdmin",
  "securityGuard",
];

const defaultRoleCapabilities: Record<CanonicalUserRole, Record<Permission, boolean>> = {
  platformAdmin: {
    "platform.manage": true,
    "communities.create": true,
    "communities.read": true,
    "communities.update": true,
    "members.read": true,
    "members.write": true,
    "memberships.read": true,
    "invites.read": true,
    "invites.write": true,
    "residents.read": true,
    "residents.write": true,
    "visitors.read": true,
    "visitors.write": true,
    "complaints.read": true,
    "complaints.write": true,
    "notices.read": true,
    "notices.write": true,
    "maintenance.read": true,
    "maintenance.write": true,
    "audit.read": true,
  },
  communityAdmin: {
    "platform.manage": false,
    "communities.create": false,
    "communities.read": true,
    "communities.update": true,
    "members.read": true,
    "members.write": true,
    "memberships.read": true,
    "invites.read": true,
    "invites.write": true,
    "residents.read": true,
    "residents.write": true,
    "visitors.read": true,
    "visitors.write": true,
    "complaints.read": true,
    "complaints.write": true,
    "notices.read": true,
    "notices.write": true,
    "maintenance.read": true,
    "maintenance.write": true,
    "audit.read": true,
  },
  president: {
    "platform.manage": false,
    "communities.create": false,
    "communities.read": true,
    "communities.update": true,
    "members.read": true,
    "members.write": true,
    "memberships.read": true,
    "invites.read": true,
    "invites.write": true,
    "residents.read": true,
    "residents.write": true,
    "visitors.read": true,
    "visitors.write": false,
    "complaints.read": true,
    "complaints.write": true,
    "notices.read": true,
    "notices.write": true,
    "maintenance.read": true,
    "maintenance.write": false,
    "audit.read": true,
  },
  secretary: {
    "platform.manage": false,
    "communities.create": false,
    "communities.read": true,
    "communities.update": false,
    "members.read": true,
    "members.write": true,
    "memberships.read": true,
    "invites.read": true,
    "invites.write": true,
    "residents.read": true,
    "residents.write": true,
    "visitors.read": true,
    "visitors.write": false,
    "complaints.read": true,
    "complaints.write": true,
    "notices.read": true,
    "notices.write": true,
    "maintenance.read": true,
    "maintenance.write": false,
    "audit.read": true,
  },
  treasurer: {
    "platform.manage": false,
    "communities.create": false,
    "communities.read": true,
    "communities.update": false,
    "members.read": true,
    "members.write": false,
    "memberships.read": true,
    "invites.read": false,
    "invites.write": false,
    "residents.read": true,
    "residents.write": false,
    "visitors.read": false,
    "visitors.write": false,
    "complaints.read": false,
    "complaints.write": false,
    "notices.read": true,
    "notices.write": false,
    "maintenance.read": true,
    "maintenance.write": true,
    "audit.read": true,
  },
  committeeMember: {
    "platform.manage": false,
    "communities.create": false,
    "communities.read": true,
    "communities.update": false,
    "members.read": true,
    "members.write": false,
    "memberships.read": false,
    "invites.read": false,
    "invites.write": false,
    "residents.read": true,
    "residents.write": false,
    "visitors.read": true,
    "visitors.write": false,
    "complaints.read": true,
    "complaints.write": true,
    "notices.read": true,
    "notices.write": false,
    "maintenance.read": true,
    "maintenance.write": false,
    "audit.read": false,
  },
  owner: {
    "platform.manage": false,
    "communities.create": false,
    "communities.read": true,
    "communities.update": false,
    "members.read": false,
    "members.write": false,
    "memberships.read": false,
    "invites.read": false,
    "invites.write": false,
    "residents.read": true,
    "residents.write": false,
    "visitors.read": true,
    "visitors.write": true,
    "complaints.read": true,
    "complaints.write": true,
    "notices.read": true,
    "notices.write": false,
    "maintenance.read": true,
    "maintenance.write": false,
    "audit.read": false,
  },
  resident: {
    "platform.manage": false,
    "communities.create": false,
    "communities.read": true,
    "communities.update": false,
    "members.read": false,
    "members.write": false,
    "memberships.read": false,
    "invites.read": false,
    "invites.write": false,
    "residents.read": true,
    "residents.write": false,
    "visitors.read": true,
    "visitors.write": true,
    "complaints.read": true,
    "complaints.write": true,
    "notices.read": true,
    "notices.write": false,
    "maintenance.read": true,
    "maintenance.write": false,
    "audit.read": false,
  },
  tenant: {
    "platform.manage": false,
    "communities.create": false,
    "communities.read": true,
    "communities.update": false,
    "members.read": false,
    "members.write": false,
    "memberships.read": false,
    "invites.read": false,
    "invites.write": false,
    "residents.read": true,
    "residents.write": false,
    "visitors.read": true,
    "visitors.write": true,
    "complaints.read": true,
    "complaints.write": true,
    "notices.read": true,
    "notices.write": false,
    "maintenance.read": true,
    "maintenance.write": false,
    "audit.read": false,
  },
  vendor: {
    "platform.manage": false,
    "communities.create": false,
    "communities.read": true,
    "communities.update": false,
    "members.read": false,
    "members.write": false,
    "memberships.read": false,
    "invites.read": false,
    "invites.write": false,
    "residents.read": false,
    "residents.write": false,
    "visitors.read": false,
    "visitors.write": false,
    "complaints.read": false,
    "complaints.write": false,
    "notices.read": true,
    "notices.write": false,
    "maintenance.read": false,
    "maintenance.write": false,
    "audit.read": false,
  },
  security: {
    "platform.manage": false,
    "communities.create": false,
    "communities.read": true,
    "communities.update": false,
    "members.read": false,
    "members.write": false,
    "memberships.read": false,
    "invites.read": false,
    "invites.write": false,
    "residents.read": false,
    "residents.write": false,
    "visitors.read": true,
    "visitors.write": true,
    "complaints.read": false,
    "complaints.write": false,
    "notices.read": true,
    "notices.write": false,
    "maintenance.read": false,
    "maintenance.write": false,
    "audit.read": false,
  },
};

export function normalizeRole(role: UserRole): CanonicalUserRole {
  return roleAliases[role] ?? (role as CanonicalUserRole);
}

export function sanitizeInviteRoles(value: unknown): CanonicalUserRole[] {
  if (!Array.isArray(value)) {
    return ["resident"];
  }

  const roles = value
    .filter((role): role is UserRole => allowedInviteRoles.includes(role as UserRole))
    .map(normalizeRole);

  return roles.length > 0 ? Array.from(new Set(roles)) : ["resident"];
}

export function resolvePrimaryRole(
  value: unknown,
  roles: CanonicalUserRole[],
): CanonicalUserRole {
  return typeof value === "string" &&
    roles.includes(normalizeRole(value as UserRole))
    ? normalizeRole(value as UserRole)
    : roles[0];
}

export function capabilitiesForRoles(
  roles: CanonicalUserRole[],
): Record<string, boolean> {
  return roles.reduce<Record<string, boolean>>((capabilities, role) => {
    return Object.entries(defaultRoleCapabilities[role]).reduce<Record<string, boolean>>(
      (nextCapabilities, [permission, allowed]) => {
        if (allowed) {
          nextCapabilities[permission] = true;
        }

        return nextCapabilities;
      },
      capabilities,
    );
  }, {});
}

export function rolesHavePermission(
  roles: UserRole[],
  permission: Permission,
  capabilities: Record<string, boolean> = {},
): boolean {
  return (
    capabilities["*"] === true ||
    capabilities[permission] === true ||
    roles.some((role) => defaultRoleCapabilities[normalizeRole(role)][permission])
  );
}
