import { Events, GuildMember } from 'discord.js';
import { BotEvent } from '@/shared/types/bot.type';
import { GuildChannelTypes } from '@/modules/guild/constants/channel-types.constant';
import { memberMessageService } from '@/modules/guild/services/member-message.service';
import { memberRoleService } from '@/modules/guild/services/member-role.service';

const guildMemberAdd: BotEvent<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  once: false,
  execute: async (member: GuildMember): Promise<void> => {
    if (member.user.bot) return;

    await memberMessageService.sendMemberEvent(
      member.guild,
      member,
      GuildChannelTypes.MEMBER_JOIN,
    );

    await memberRoleService.assignJoinRole(member);
  },
};

export default guildMemberAdd;
