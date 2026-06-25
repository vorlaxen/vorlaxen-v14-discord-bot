import { Events, Client } from 'discord.js';
import { BotEvent } from '@/shared/types/bot.type';
import { guildService } from '@/modules/guild/services/guild.service';

const guildSync: BotEvent<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: Client): Promise<void> => {
    await guildService.syncAllGuilds(client.guilds.cache);
  },
};

export default guildSync;
