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
  communityConfigs: "community_configs",
  communityConfig: (communityId: string) => `community_configs/${communityId}`,
  brandingConfigs: "branding_configs",
  brandingConfig: (communityId: string) => `branding_configs/${communityId}`,
  terminologyConfigs: "terminology_configs",
  terminologyConfig: (communityId: string) => `terminology_configs/${communityId}`,
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
