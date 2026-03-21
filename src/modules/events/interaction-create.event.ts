import { botClientConfig } from '@/config';
import { VorlaxenBot } from '@/core/bot';
import logger from '@/infrastructure/logger';
import { BotEvent } from '@/shared/types/bot.type';
import { checkCooldown } from '@/shared/utils/bot';
import { Events, Interaction, PermissionsBitField } from 'discord.js';

const interactionCreate: BotEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  once: false,
  execute: async (interaction: Interaction): Promise<void> => {
    const client = interaction.client as VorlaxenBot;

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (command.settings?.disabled) {
      interaction.reply({ content: 'Bu komut şu anda devre dışı.', ephemeral: true });
      return;
    }

    if (command.settings?.mainGuildOnly && interaction.guildId !== botClientConfig.testGuildId) {
      interaction.reply({
        content: 'Bu komut yalnızca ana sunucuda kullanılabilir.',
        ephemeral: true,
      });
      return;
    }

    if (command.settings?.ownerRequired) {
      const isOwner = Array.isArray(botClientConfig.ownerIds)
        ? botClientConfig.ownerIds.includes(interaction.user.id)
        : interaction.user.id === (botClientConfig as any).ownerId;

      if (!isOwner) {
        interaction.reply({
          content: 'Bu komutu yalnızca bot sahipleri kullanabilir.',
          ephemeral: true,
        });
        return;
      }
    }

    if (command.settings?.adminRequired) {
      if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
        interaction.reply({
          content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısın.',
          ephemeral: true,
        });
        return;
      }
    }

    if (command.settings?.cooldown && command.settings.cooldown > 0) {
      try {
        const ttl = await checkCooldown(
          interaction.user.id,
          command.name,
          command.settings.cooldown
        );
        if (ttl > 0) {
          interaction.reply({
            content: `Bu komutu tekrar kullanmadan önce **${ttl} saniye** beklemelisin.`,
            ephemeral: true,
          });
          return;
        }
      } catch (err) {
        logger.error(`[Cooldown] Check failed: ${interaction.commandName}`, err);
      }
    }

    try {
      logger.info(`[Slash Command] ${interaction.user.tag} kullandı: ${interaction.commandName}`);

      if (command.execute) {
        await command.execute(interaction, client);
      } else {
        await interaction.reply({
          content: 'Bu komutun Slash desteği bulunmuyor.',
          ephemeral: true,
        });
      }

      const deleteTime = command.settings?.deleteTime;
      if (deleteTime) {
        setTimeout(async () => {
          try {
            await interaction.deleteReply().catch(() => {});
          } catch (e) {}
        }, deleteTime);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error(`[Command Error] ${interaction.commandName}: ${error.message}`, {
        stack: error.stack,
      });

      const errorPayload = { content: 'Komut çalıştırılırken bir hata oluştu.', ephemeral: true };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorPayload).catch(() => {});
      } else {
        await interaction.reply(errorPayload).catch(() => {});
      }
    }
  },
};

export default interactionCreate;
