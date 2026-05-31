export const firestorePaths = {
  users: "users",
  user: (uid: string) => `users/${uid}`,
  memberships: "memberships",
  membership: (membershipId: string) => `memberships/${membershipId}`,
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
