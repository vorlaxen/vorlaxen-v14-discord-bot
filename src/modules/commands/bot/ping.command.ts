import { SlashCommandBuilder, Message, ChatInputCommandInteraction } from 'discord.js';
import { BotCommand } from '@/shared/types/bot.type';
import { BotComponentColor } from '@/config';
import { MessageHelper } from '@/shared/utils/bot';

const PingCommand: BotCommand = {
  name: 'ping',
  description: 'Measures system latency and server status.',
  aliases: ['latency', 'p'],
  settings: { cooldown: 5 },
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Measures system latency and server status.'),

  execute: async context => {
    const isSlash = context instanceof ChatInputCommandInteraction;
    const startTime = Date.now();

    if (isSlash) {
      await context.deferReply({ ephemeral: true });
    }

    const wsPing = context.client.ws.ping;
    const msgPing = Date.now() - startTime;

    const pingEmbed = MessageHelper.createEmbed({
      title: 'System Status Report',
      description: 'Current latency values for the Vorlaxen infrastructure are listed below.',
      color: wsPing > 200 ? BotComponentColor.DANGER : BotComponentColor.SUCCESS,
      fields: [
        { name: 'API Latency', value: `\`${wsPing}ms\``, inline: true },
        { name: 'Message Response', value: `\`${msgPing}ms\``, inline: true },
      ],
    });

    const row = MessageHelper.linkButton('System Status (Web)', 'https://status.vorlaxen.com');

    if (isSlash) {
      return await context.editReply({
        embeds: [pingEmbed],
        components: [row],
      });
    } else {
      return await (context as Message).reply({
        embeds: [pingEmbed],
        components: [row],
      });
    }
  },
};

export default PingCommand;
