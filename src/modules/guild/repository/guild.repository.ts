import { DataSource, Repository } from 'typeorm';
import { Guild } from './models/guild.entity';
import { GuildData } from '../types/guild-data.type';

export class GuildRepository {
  private readonly repo: Repository<Guild>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Guild);
  }

  findByDiscordId(discordGuildId: string): Promise<Guild | null> {
    return this.repo.findOne({ where: { discordGuildId } });
  }

  findById(id: string): Promise<Guild | null> {
    return this.repo.findOne({ where: { id } });
  }

  async upsertByDiscordId(
    discordGuildId: string,
    data: Partial<GuildData> = {},
  ): Promise<Guild> {
    const existing = await this.findByDiscordId(discordGuildId);

    if (existing) {
      existing.data = {
        ...existing.data,
        ...data,
        meta: { ...existing.data.meta, ...data.meta },
        messages: { ...existing.data.messages, ...data.messages },
      };
      if (existing.data.meta?.leftAt) {
        delete existing.data.meta.leftAt;
      }
      return this.repo.save(existing);
    }

    const guild = this.repo.create({
      discordGuildId,
      data,
    });
    return this.repo.save(guild);
  }

  async updateData(id: string, data: Partial<GuildData>): Promise<Guild | null> {
    const guild = await this.findById(id);
    if (!guild) return null;

    guild.data = {
      ...guild.data,
      ...data,
      meta: { ...guild.data.meta, ...data.meta },
      messages: { ...guild.data.messages, ...data.messages },
    };
    return this.repo.save(guild);
  }

  async markLeft(discordGuildId: string): Promise<void> {
    const guild = await this.findByDiscordId(discordGuildId);
    if (!guild) return;

    guild.data = {
      ...guild.data,
      meta: {
        ...guild.data.meta,
        leftAt: new Date().toISOString(),
      },
    };
    await this.repo.save(guild);
  }
}
