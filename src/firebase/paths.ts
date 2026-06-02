export const firestorePaths = {
  users: "users",
  user: (uid: string) => `users/${uid}`,
  memberships: "memberships",
  membership: (membershipId: string) => `memberships/${membershipId}`,
  communities: "communities",
  community: (communityId: string) => `communities/${communityId}`,
  communityMembers: (communityId: string) => `communities/${communityId}/members`,
  communityMember: (communityId: string, userId: string) =>
    `communities/${communityId}/members/${userId}`,
  communityInvites: (communityId: string) => `communities/${communityId}/invites`,
  communityInvite: (communityId: string, tokenHash: string) =>
    `communities/${communityId}/invites/${tokenHash}`,
  communityConfigs: (communityId: string) =>
    `communities/${communityId}/community_configs`,
  communityConfig: (communityId: string, group = "default") =>
    `communities/${communityId}/community_configs/${group}`,
  brandingConfigs: (communityId: string) =>
    `communities/${communityId}/branding_configs`,
  brandingConfig: (communityId: string, configId = "default") =>
    `communities/${communityId}/branding_configs/${configId}`,
  terminologyConfigs: (communityId: string) =>
    `communities/${communityId}/terminology_configs`,
  terminologyConfig: (communityId: string, configId = "default") =>
    `communities/${communityId}/terminology_configs/${configId}`,
  societies: "societies",
  society: (societyId: string) => `societies/${societyId}`,
  societyMembers: (societyId: string) => `societies/${societyId}/members`,
  societyMember: (societyId: string, userId: string) =>
    `societies/${societyId}/members/${userId}`,
  societyInvites: (societyId: string) => `societies/${societyId}/invites`,
  societyInvite: (societyId: string, tokenHash: string) =>
    `societies/${societyId}/invites/${tokenHash}`,
  auditLogs: "auditLogs",
} as const;
