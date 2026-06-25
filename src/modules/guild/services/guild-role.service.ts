import { Guild as DiscordGuild, Role } from 'discord.js';
import { DatabaseService } from '@/infra/database';
import { isValidRoleType } from '../constants/role-type.registry';
import { GuildRoleRepository } from '../repository/guild-role.repository';
import { GuildRepository } from '../repository/guild.repository';
import { GuildRole } from '../repository/models/guild-role.entity';
import { guildService } from './guild.service';

export class GuildRoleService {
  private static instance: GuildRoleService;
  private readonly roleRepo: GuildRoleRepository;
  private readonly guildRepo: GuildRepository;

  private constructor() {
    const dataSource = DatabaseService.getInstance();
    this.roleRepo = new GuildRoleRepository(dataSource);
    this.guildRepo = new GuildRepository(dataSource);
  }

  static getInstance(): GuildRoleService {
    if (!GuildRoleService.instance) {
      GuildRoleService.instance = new GuildRoleService();
    }
    return GuildRoleService.instance;
  }

  validateRoleType(type: string): void {
    if (!isValidRoleType(type)) {
      throw new Error('Geçersiz seçim. Lütfen listeden bir hedef seç.');
    }
  }

  validateDiscordRole(discordGuild: DiscordGuild, role: Role): void {
    if (role.guild.id !== discordGuild.id) {
      throw new Error('Bu rol bu sunucuya ait değil.');
    }

    if (role.id === discordGuild.id) {
      throw new Error('@everyone rolü seçilemez.');
    }

    if (role.managed) {
      throw new Error('Bot veya entegrasyon rolleri seçilemez.');
    }

    const botMember = discordGuild.members.me;
    if (!botMember) {
      throw new Error('Bot üye bilgisine ulaşılamadı.');
    }

    if (!botMember.permissions.has('ManageRoles')) {
      throw new Error('Botun rol yönetme yetkisi yok.');
    }

    if (role.position >= botMember.roles.highest.position) {
      throw new Error(
        'Bu rol botun en yüksek rolünden yukarıda. Bot bu rolü veremez.',
      );
    }
  }

  async setRole(
    discordGuild: DiscordGuild,
    type: string,
    role: Role,
  ): Promise<GuildRole> {
    this.validateRoleType(type);
    this.validateDiscordRole(discordGuild, role);

    const guild = await guildService.upsertFromDiscord(discordGuild);
    return this.roleRepo.setRole(guild.id, type, role.id);
  }

  async listRoles(discordGuildId: string): Promise<GuildRole[]> {
    const guild = await this.guildRepo.findByDiscordId(discordGuildId);
    if (!guild) return [];
    return this.roleRepo.listByGuild(guild.id);
  }

  async getRoleBinding(
    discordGuildId: string,
    type: string,
  ): Promise<GuildRole | null> {
    this.validateRoleType(type);
    const guild = await this.guildRepo.findByDiscordId(discordGuildId);
    if (!guild) return null;
    return this.roleRepo.findByGuildAndType(guild.id, type);
  }

  async clearRole(discordGuildId: string, type: string): Promise<boolean> {
    this.validateRoleType(type);
    const guild = await this.guildRepo.findByDiscordId(discordGuildId);
    if (!guild) return false;
    return this.roleRepo.clearByType(guild.id, type);
  }
}

export const guildRoleService = GuildRoleService.getInstance();
