import { Events, Guild } from 'discord.js';
import { BotEvent } from '@/shared/types/bot.type';
import { guildService } from '@/modules/guild/services/guild.service';

const guildCreate: BotEvent<Events.GuildCreate> = {
  name: Events.GuildCreate,
  once: false,
  execute: async (guild: Guild): Promise<void> => {
    await guildService.upsertFromDiscord(guild);
  },
};

export default guildCreate;
