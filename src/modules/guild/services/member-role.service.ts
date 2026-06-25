import { GuildMember } from 'discord.js';
import { logger } from '@/infra/logger';
import { GuildRoleTypes } from '../constants/role-types.constant';
import { guildRoleService } from './guild-role.service';

export class MemberRoleService {
  private static instance: MemberRoleService;

  private constructor() {}

  static getInstance(): MemberRoleService {
    if (!MemberRoleService.instance) {
      MemberRoleService.instance = new MemberRoleService();
    }
    return MemberRoleService.instance;
  }

  async assignJoinRole(member: GuildMember): Promise<void> {
    try {
      const binding = await guildRoleService.getRoleBinding(
        member.guild.id,
        GuildRoleTypes.MEMBER_JOIN,
      );

      if (!binding) return;

      const role = await member.guild.roles.fetch(binding.roleId).catch(() => null);
      if (!role) {
        logger.warn(
          { guildId: member.guild.id, roleId: binding.roleId },
          'MemberRoleService: Configured role not found',
        );
        return;
      }

      if (member.roles.cache.has(role.id)) return;

      guildRoleService.validateDiscordRole(member.guild, role);
      await member.roles.add(role);

      logger.info(
        {
          guildId: member.guild.id,
          userId: member.id,
          roleId: role.id,
        },
        'MemberRoleService: Join role assigned',
      );
    } catch (error) {
      logger.error(
        { err: error, guildId: member.guild.id, userId: member.id },
        'MemberRoleService: Failed to assign join role',
      );
    }
  }
}

export const memberRoleService = MemberRoleService.getInstance();
