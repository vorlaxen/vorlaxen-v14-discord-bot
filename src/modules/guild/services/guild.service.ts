import { Guild as DiscordGuild, Collection } from 'discord.js';
import { DatabaseService } from '@/infra/database';
import { logger } from '@/infra/logger';
import { GuildRepository } from '../repository/guild.repository';
import { Guild } from '../repository/models/guild.entity';

export class GuildService {
  private static instance: GuildService;
  private readonly repo: GuildRepository;

  private constructor() {
    this.repo = new GuildRepository(DatabaseService.getInstance());
  }

  static getInstance(): GuildService {
    if (!GuildService.instance) {
      GuildService.instance = new GuildService();
    }
    return GuildService.instance;
  }

  async findByDiscordId(discordGuildId: string): Promise<Guild | null> {
    return this.repo.findByDiscordId(discordGuildId);
  }

  async upsertFromDiscord(discordGuild: DiscordGuild): Promise<Guild> {
    const guild = await this.repo.upsertByDiscordId(discordGuild.id, {
      meta: { name: discordGuild.name },
    });

    logger.info(
      { discordGuildId: discordGuild.id, name: discordGuild.name },
      'GuildService: Guild upserted',
    );

    return guild;
  }

  async syncAllGuilds(
    discordGuilds: Collection<string, DiscordGuild> | DiscordGuild[],
  ): Promise<void> {
    const guilds =
      discordGuilds instanceof Collection
        ? Array.from(discordGuilds.values())
        : discordGuilds;

    logger.info({ count: guilds.length }, 'GuildService: Syncing guilds on ready');

    for (const discordGuild of guilds) {
      await this.upsertFromDiscord(discordGuild);
    }
  }

  async markLeft(discordGuildId: string): Promise<void> {
    await this.repo.markLeft(discordGuildId);
    logger.info({ discordGuildId }, 'GuildService: Guild marked as left');
  }
}

export const guildService = GuildService.getInstance();
