import { Events, Guild } from 'discord.js';
import { BotEvent } from '@/shared/types/bot.type';
import { guildService } from '@/modules/guild/services/guild.service';

const guildDelete: BotEvent<Events.GuildDelete> = {
  name: Events.GuildDelete,
  once: false,
  execute: async (guild: Guild): Promise<void> => {
    await guildService.markLeft(guild.id);
  },
};

export default guildDelete;
