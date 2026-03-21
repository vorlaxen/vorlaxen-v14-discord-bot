import { SlashCommandBuilder, Message, ChatInputCommandInteraction } from 'discord.js';
import { BotCommand } from '@/shared/types/bot.type';

const PingCommand: BotCommand = {
  name: 'ping',
  description: 'Botun gecikmesini ölçer.',
  aliases: ['gecikme', 'p'],
  settings: { cooldown: 5 },
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botun gecikmesini ölçer.'),
    
  execute: async (context, args) => {
    const isSlash = context instanceof ChatInputCommandInteraction;
    const content = `🏓 Pong! Gecikme: **${context.client.ws.ping}ms**`;

    if (isSlash) {
      return await context.reply({ content, ephemeral: true });
    } else {
      return await (context as Message).reply(content);
    }
  },
};

export default PingCommand;