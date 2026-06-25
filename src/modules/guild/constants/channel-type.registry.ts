import { ChannelType } from 'discord.js';
import { GuildChannelType, GuildChannelTypes } from './channel-types.constant';

export interface ChannelTypeDefinition {
  key: GuildChannelType;
  label: string;
  description: string;
  defaultTemplate: string;
  defaultUseEmbed: boolean;
  allowedChannelTypes: ChannelType[];
}

export const CHANNEL_TYPE_REGISTRY: Record<
  GuildChannelType,
  ChannelTypeDefinition
> = {
  [GuildChannelTypes.MEMBER_JOIN]: {
    key: GuildChannelTypes.MEMBER_JOIN,
    label: 'Gelen',
    description: 'Sunucuya yeni katılan üyeler',
    defaultTemplate: '{user} sunucumuza katıldı! Hoş geldin.',
    defaultUseEmbed: true,
    allowedChannelTypes: [
      ChannelType.GuildText,
      ChannelType.GuildAnnouncement,
    ],
  },
  [GuildChannelTypes.MEMBER_LEAVE]: {
    key: GuildChannelTypes.MEMBER_LEAVE,
    label: 'Giden',
    description: 'Sunucudan ayrılan üyeler',
    defaultTemplate: '{user} sunucumuzdan ayrıldı.',
    defaultUseEmbed: true,
    allowedChannelTypes: [
      ChannelType.GuildText,
      ChannelType.GuildAnnouncement,
    ],
  },
};

export const CHANNEL_TYPE_LIST = Object.values(CHANNEL_TYPE_REGISTRY);

export function isValidChannelType(type: string): type is GuildChannelType {
  return type in CHANNEL_TYPE_REGISTRY;
}

export function getChannelTypeDefinition(
  type: string,
): ChannelTypeDefinition | undefined {
  if (!isValidChannelType(type)) return undefined;
  return CHANNEL_TYPE_REGISTRY[type];
}

export function filterChannelTypes(query: string): ChannelTypeDefinition[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return CHANNEL_TYPE_LIST;

  return CHANNEL_TYPE_LIST.filter(
    (entry) =>
      entry.label.toLowerCase().includes(normalized) ||
      entry.description.toLowerCase().includes(normalized),
  );
}
