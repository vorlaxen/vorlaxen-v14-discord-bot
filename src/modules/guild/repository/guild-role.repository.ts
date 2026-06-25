import { DataSource, Repository } from 'typeorm';
import { GuildRole } from './models/guild-role.entity';

export class GuildRoleRepository {
  private readonly repo: Repository<GuildRole>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(GuildRole);
  }

  findByGuildAndType(
    guildId: string,
    type: string,
  ): Promise<GuildRole | null> {
    return this.repo.findOne({ where: { guildId, type } });
  }

  listByGuild(guildId: string): Promise<GuildRole[]> {
    return this.repo.find({ where: { guildId }, order: { type: 'ASC' } });
  }

  async setRole(
    guildId: string,
    type: string,
    roleId: string,
  ): Promise<GuildRole> {
    const existing = await this.findByGuildAndType(guildId, type);

    if (existing) {
      existing.roleId = roleId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({ guildId, type, roleId });
    return this.repo.save(record);
  }

  async clearByType(guildId: string, type: string): Promise<boolean> {
    const result = await this.repo.delete({ guildId, type });
    return (result.affected ?? 0) > 0;
  }
}
