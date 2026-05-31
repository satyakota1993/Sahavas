import type { MembershipWithSociety, RoleContext } from "@/types/membership";

export function resolveRoleContext(
  userId: string,
  memberships: MembershipWithSociety[],
  activeSocietyId?: string | null,
): RoleContext | null {
  const activeMembership =
    memberships.find((membership) => membership.societyId === activeSocietyId) ??
    memberships[0];

  if (!activeMembership) {
    return null;
  }

  return {
    userId,
    societyId: activeMembership.societyId,
    roles: activeMembership.roles,
    primaryRole: activeMembership.primaryRole,
    capabilities: activeMembership.capabilities,
    activeMembership,
    can: (capability: string) =>
      activeMembership.capabilities["*"] === true ||
      activeMembership.capabilities[capability] === true ||
      activeMembership.roles.includes("superAdmin"),
  };
}
