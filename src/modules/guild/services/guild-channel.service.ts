import {
  ChannelType,
  GuildBasedChannel,
  Guild as DiscordGuild,
} from 'discord.js';
import { DatabaseService } from '@/infra/database';
import {
  getChannelTypeDefinition,
  isValidChannelType,
} from '../constants/channel-type.registry';
import { GuildChannelRepository } from '../repository/guild-channel.repository';
import { GuildRepository } from '../repository/guild.repository';
import { GuildChannel } from '../repository/models/guild-channel.entity';
import { guildService } from './guild.service';

export class GuildChannelService {
  private static instance: GuildChannelService;
  private readonly channelRepo: GuildChannelRepository;
  private readonly guildRepo: GuildRepository;

  private constructor() {
    const dataSource = DatabaseService.getInstance();
    this.channelRepo = new GuildChannelRepository(dataSource);
    this.guildRepo = new GuildRepository(dataSource);
  }

  static getInstance(): GuildChannelService {
    if (!GuildChannelService.instance) {
      GuildChannelService.instance = new GuildChannelService();
    }
    return GuildChannelService.instance;
  }

  validateChannelType(type: string): void {
    if (!isValidChannelType(type)) {
      throw new Error('Geçersiz seçim. Lütfen listeden bir bildirim türü seç.');
    }
  }

  validateDiscordChannel(
    type: string,
    channel: Pick<GuildBasedChannel, 'type'>,
  ): void {
    const definition = getChannelTypeDefinition(type);
    if (!definition) {
      throw new Error('Geçersiz seçim. Lütfen listeden bir bildirim türü seç.');
    }

    if (!definition.allowedChannelTypes.includes(channel.type)) {
      throw new Error('Buraya yalnızca metin veya duyuru kanalı seçebilirsin.');
    }
  }

  async setChannel(
    discordGuild: DiscordGuild,
    type: string,
    channel: GuildBasedChannel | { id: string; type: ChannelType; guildId?: string | null },
  ): Promise<GuildChannel> {
    this.validateChannelType(type);

    if (!('type' in channel) || channel.guildId !== discordGuild.id) {
      throw new Error('Kanal bu sunucuya ait değil.');
    }

    this.validateDiscordChannel(type, channel as GuildBasedChannel);

    const guild = await guildService.upsertFromDiscord(discordGuild);
    return this.channelRepo.setChannel(guild.id, type, channel.id);
  }

  async listChannels(discordGuildId: string): Promise<GuildChannel[]> {
    const guild = await this.guildRepo.findByDiscordId(discordGuildId);
    if (!guild) return [];
    return this.channelRepo.listByGuild(guild.id);
  }

  async getChannelBinding(
    discordGuildId: string,
    type: string,
  ): Promise<GuildChannel | null> {
    this.validateChannelType(type);
    const guild = await this.guildRepo.findByDiscordId(discordGuildId);
    if (!guild) return null;
    return this.channelRepo.findByGuildAndType(guild.id, type);
  }

  async clearChannel(
    discordGuildId: string,
    type: string,
  ): Promise<boolean> {
    this.validateChannelType(type);
    const guild = await this.guildRepo.findByDiscordId(discordGuildId);
    if (!guild) return false;
    return this.channelRepo.clearByType(guild.id, type);
  }
}

export const guildChannelService = GuildChannelService.getInstance();
