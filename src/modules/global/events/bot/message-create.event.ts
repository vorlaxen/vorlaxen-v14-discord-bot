import { Events, Message, PermissionsBitField } from 'discord.js';
import { BotEvent } from '@/shared/types/bot.type';
import { VorlaxenBot } from '@/core/bot';
import { botClientConfig } from '@/config';
import logger from '@/infrastructure/logger';
import { checkCooldown } from '@/shared/utils/bot/bot-cache.util';

const messageCreate: BotEvent<Events.MessageCreate> = {
  name: Events.MessageCreate,
  once: false,
  execute: async (message: Message): Promise<void> => {
    const client = message.client as VorlaxenBot;
    const prefix = botClientConfig.prefix;

    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift()?.toLowerCase();
    if (!cmdName) return;

    const command = client.commands.get(cmdName);
    if (!command) return;

    if (command.settings?.ownerRequired) {
      const isOwner = botClientConfig.ownerIds.includes(message.author.id);
      if (!isOwner) {
        return message.reply('This command is restricted to bot owners only.').then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 5000);
        });
      }
    }

    if (command.settings?.adminRequired) {
      if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
        message.reply('Administrator permissions are required to execute this command.');
        return;
      }
    }

    if (command.settings?.mainGuildOnly && message.guildId !== botClientConfig.testGuildId) {
      message.reply('This command can only be used in the management server.');
      return;
    }

    if (command.settings?.cooldown && command.settings.cooldown > 0) {
      try {
        const remainingTime = await checkCooldown(
          message.author.id,
          command.name,
          command.settings.cooldown
        );
        if (remainingTime > 0) {
          message.reply(
            `Please wait **${remainingTime}s** before reusing the \`${command.name}\` command.`
          );
          return;
        }
      } catch (err) {
        logger.error(`[Cooldown] Check failed for ${cmdName}:`, err);
      }
    }

    const logMetadata = {
      user: `${message.author.tag} (${message.author.id})`,
      guild: `${message.guild?.name} (${message.guildId})`,
      channel: `${message.channelId}`,
      command: cmdName,
      args: args.join(' '),
      type: 'PREFIX',
    };

    try {
      logger.info(`[Command] Execution started: ${cmdName}`, logMetadata);

      const startTime = Date.now();
      await command.execute(message, args);
      const duration = Date.now() - startTime;

      logger.info(`[Command] Execution completed: ${cmdName}`, {
        ...logMetadata,
        duration: `${duration}ms`,
      });
    } catch (err) {
      logger.error(`[Command] Execution failed: ${cmdName}`, {
        ...logMetadata,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      await message.reply('🚨 An unexpected error occurred while executing this command.');
    }
  },
};

export default messageCreate;
