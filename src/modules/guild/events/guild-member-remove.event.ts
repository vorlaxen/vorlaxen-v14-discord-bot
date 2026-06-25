import { Events, GuildMember, PartialGuildMember } from 'discord.js';
import { BotEvent } from '@/shared/types/bot.type';
import { GuildChannelTypes } from '@/modules/guild/constants/channel-types.constant';
import { memberMessageService } from '@/modules/guild/services/member-message.service';

const guildMemberRemove: BotEvent<Events.GuildMemberRemove> = {
  name: Events.GuildMemberRemove,
  once: false,
  execute: async (member: GuildMember | PartialGuildMember): Promise<void> => {
    if (member.user?.bot) return;

    await memberMessageService.sendMemberEvent(
      member.guild,
      member,
      GuildChannelTypes.MEMBER_LEAVE,
    );
  },
};

export default guildMemberRemove;
