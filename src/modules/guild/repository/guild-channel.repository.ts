import { DataSource, Repository } from 'typeorm';
import { GuildChannel } from './models/guild-channel.entity';

export class GuildChannelRepository {
  private readonly repo: Repository<GuildChannel>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(GuildChannel);
  }

  findByGuildAndType(
    guildId: string,
    type: string,
  ): Promise<GuildChannel | null> {
    return this.repo.findOne({ where: { guildId, type } });
  }

  listByGuild(guildId: string): Promise<GuildChannel[]> {
    return this.repo.find({ where: { guildId }, order: { type: 'ASC' } });
  }

  async setChannel(
    guildId: string,
    type: string,
    channelId: string,
  ): Promise<GuildChannel> {
    const existing = await this.findByGuildAndType(guildId, type);

    if (existing) {
      existing.channelId = channelId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({ guildId, type, channelId });
    return this.repo.save(record);
  }

  async clearByType(guildId: string, type: string): Promise<boolean> {
    const result = await this.repo.delete({ guildId, type });
    return (result.affected ?? 0) > 0;
  }
}
