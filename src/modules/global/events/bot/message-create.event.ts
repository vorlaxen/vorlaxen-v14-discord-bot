import { Events, Message, PermissionsBitField } from 'discord.js';
import { BotEvent } from '@/shared/types/bot.type';
import { VorlaxenBot } from '@/app/bot';
import { botClientConfig } from '@/config';
import { logger } from '@/infra/logger';
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
        return message.reply('Bu komutu yalnızca bot sahipleri kullanabilir.').then(msg => {
          setTimeout(() => msg.delete().catch(() => { }), 5000);
        });
      }
    }

    if (command.settings?.adminRequired) {
      if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
        message.reply('Bu komutu kullanmak için yönetici yetkisine sahip olmalısın.');
        return;
      }
    }

    if (command.settings?.mainGuildOnly && message.guildId !== botClientConfig.GuildId) {
      message.reply('Bu komut yalnızca ana sunucuda kullanılabilir.');
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
            `\`${command.name}\` komutunu tekrar kullanmadan önce **${remainingTime} saniye** beklemelisin.`
          );
          return;
        }
      } catch (err) {
        logger.error({ err }, `[Cooldown] Check failed for ${cmdName}`);
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
      logger.info(logMetadata, `[Command] Execution started: ${cmdName}`);

      const startTime = Date.now();
      await command.execute(message, args);
      const duration = Date.now() - startTime;

      logger.info(
        { ...logMetadata, duration: `${duration}ms` },
        `[Command] Execution completed: ${cmdName}`,
      );
    } catch (err) {
      logger.error(
        {
          ...logMetadata,
          err: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        },
        `[Command] Execution failed: ${cmdName}`,
      );

      await message.reply('🚨 Komut çalıştırılırken beklenmeyen bir hata oluştu.');
    }
  },
};

export default messageCreate;
