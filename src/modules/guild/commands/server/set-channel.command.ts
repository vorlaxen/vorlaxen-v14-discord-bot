import {
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { BotCommand } from '@/shared/types/bot.type';
import { BotComponentColor } from '@/config';
import { MessageHelper } from '@/shared/utils/bot';
import {
  filterChannelTypes,
  getChannelTypeDefinition,
} from '@/modules/guild/constants/channel-type.registry';
import { guildChannelService } from '@/modules/guild/services/guild-channel.service';

const SetChannelCommand: BotCommand = {
  name: 'kanal-ayarla',
  description: 'Gelen-giden gibi bildirim kanallarını ayarlar.',
  aliases: ['set-channel', 'kanal'],
  settings: { manageGuildRequired: true },
  data: new SlashCommandBuilder()
    .setName('kanal-ayarla')
    .setDescription('Gelen-giden gibi bildirim kanallarını ayarlar.')
    .addSubcommand((sub) =>
      sub
        .setName('ayarla')
        .setDescription('Bir bildirim için kanal belirle')
        .addStringOption((option) =>
          option
            .setName('tur')
            .setDescription('Hangi bildirim için kanal ayarlanacak?')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addChannelOption((option) =>
          option
            .setName('kanal')
            .setDescription('Mesajların gönderileceği kanal')
            .setRequired(true)
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('listele').setDescription('Ayarlanmış kanalları göster'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('temizle')
        .setDescription('Bir bildirim kanalı ayarını kaldır')
        .addStringOption((option) =>
          option
            .setName('tur')
            .setDescription('Hangi bildirim ayarı kaldırılacak?')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),

  autocomplete: async (interaction: AutocompleteInteraction) => {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'tur') {
      await interaction.respond([]);
      return;
    }

    const matches = filterChannelTypes(focused.value);
    await interaction.respond(
      matches.slice(0, 25).map((entry) => ({
        name: entry.label,
        value: entry.key,
      })),
    );
  },

  execute: async (context: ChatInputCommandInteraction) => {
    if (!(context instanceof ChatInputCommandInteraction)) return;
    if (!context.guild) {
      return context.reply({
        content: 'Bu komut yalnızca sunucularda kullanılabilir.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const subcommand = context.options.getSubcommand();

    if (subcommand === 'ayarla') {
      const type = context.options.getString('tur', true);
      const channelOption = context.options.getChannel('kanal', true);

      const channel = await context.guild.channels.fetch(channelOption.id);
      if (!channel || !('guild' in channel)) {
        return context.reply({
          content: 'Geçerli bir sunucu kanalı seçmelisin.',
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        await guildChannelService.setChannel(context.guild, type, channel);
        const definition = getChannelTypeDefinition(type);
        const label = definition?.label ?? 'Bildirim';

        const embed = MessageHelper.createEmbed({
          title: 'Kanal ayarlandı',
          description: `**${label}** bildirimleri artık ${channelOption} kanalına gönderilecek.`,
          color: BotComponentColor.SUCCESS,
        });

        return context.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      } catch (error) {
        return context.reply({
          content:
            error instanceof Error
              ? error.message
              : 'Kanal ayarlanırken bir hata oluştu.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    if (subcommand === 'listele') {
      const bindings = await guildChannelService.listChannels(context.guild.id);

      if (bindings.length === 0) {
        return context.reply({
          content: 'Henüz ayarlanmış bir kanal yok.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const lines = bindings.map((binding) => {
        const definition = getChannelTypeDefinition(binding.type);
        const label = definition?.label ?? 'Bildirim';
        return `• **${label}** → <#${binding.channelId}>`;
      });

      const embed = MessageHelper.createEmbed({
        title: 'Bildirim kanalları',
        description: lines.join('\n'),
        color: BotComponentColor.INFO,
      });

      return context.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'temizle') {
      const type = context.options.getString('tur', true);

      try {
        const cleared = await guildChannelService.clearChannel(
          context.guild.id,
          type,
        );

        if (!cleared) {
          return context.reply({
            content: 'Bu bildirim için ayarlanmış bir kanal bulunamadı.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const definition = getChannelTypeDefinition(type);
        const label = definition?.label ?? 'Bildirim';

        return context.reply({
          content: `**${label}** kanal ayarı kaldırıldı.`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        return context.reply({
          content:
            error instanceof Error
              ? error.message
              : 'Kanal ayarı kaldırılırken bir hata oluştu.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};

export default SetChannelCommand;
