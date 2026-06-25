export const GuildChannelTypes = {
  MEMBER_JOIN: 'member_join',
  MEMBER_LEAVE: 'member_leave',
} as const;

export type GuildChannelType =
  (typeof GuildChannelTypes)[keyof typeof GuildChannelTypes];
