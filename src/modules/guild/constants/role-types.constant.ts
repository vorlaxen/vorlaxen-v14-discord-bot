export const GuildRoleTypes = {
  MEMBER_JOIN: 'member_join',
} as const;

export type GuildRoleType =
  (typeof GuildRoleTypes)[keyof typeof GuildRoleTypes];
