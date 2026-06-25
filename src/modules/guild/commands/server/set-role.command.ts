import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { BotCommand } from '@/shared/types/bot.type';
import { BotComponentColor } from '@/config';
import { MessageHelper } from '@/shared/utils/bot';
import {
  filterRoleTypes,
  getRoleTypeDefinition,
} from '@/modules/guild/constants/role-type.registry';
import { guildRoleService } from '@/modules/guild/services/guild-role.service';

const SetRoleCommand: BotCommand = {
  name: 'rol-ayarla',
  description: 'Katılınca verilecek rolleri ayarlar.',
  aliases: ['set-role', 'rol'],
  settings: { manageGuildRequired: true },
  data: new SlashCommandBuilder()
    .setName('rol-ayarla')
    .setDescription('Katılınca verilecek rolleri ayarlar.')
    .addSubcommand((sub) =>
      sub
        .setName('ayarla')
        .setDescription('Bir hedef için otomatik rol belirle')
        .addStringOption((option) =>
          option
            .setName('hedef')
            .setDescription('Ne zaman rol verilsin?')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addRoleOption((option) =>
          option
            .setName('rol')
            .setDescription('Verilecek rol')
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('listele').setDescription('Ayarlanmış otomatik rolleri göster'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('temizle')
        .setDescription('Bir otomatik rol ayarını kaldır')
        .addStringOption((option) =>
          option
            .setName('hedef')
            .setDescription('Hangi ayar kaldırılacak?')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),

  autocomplete: async (interaction: AutocompleteInteraction) => {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'hedef') {
      await interaction.respond([]);
      return;
    }

    const subcommand = interaction.options.getSubcommand(false);
    if (!subcommand || !['ayarla', 'temizle'].includes(subcommand)) {
      await interaction.respond([]);
      return;
    }

    const matches = filterRoleTypes(focused.value);
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
      const type = context.options.getString('hedef', true);
      const roleOption = context.options.getRole('rol', true);

      const role = await context.guild.roles.fetch(roleOption.id);
      if (!role) {
        return context.reply({
          content: 'Geçerli bir sunucu rolü seçmelisin.',
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        await guildRoleService.setRole(context.guild, type, role);
        const definition = getRoleTypeDefinition(type);
        const label = definition?.label ?? 'Hedef';

        const embed = MessageHelper.createEmbed({
          title: 'Rol ayarlandı',
          description: `**${label}** için otomatik rol **${role.name}** olarak ayarlandı.`,
          color: BotComponentColor.SUCCESS,
        });

        return context.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      } catch (error) {
        return context.reply({
          content:
            error instanceof Error
              ? error.message
              : 'Rol ayarlanırken bir hata oluştu.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    if (subcommand === 'listele') {
      const bindings = await guildRoleService.listRoles(context.guild.id);

      if (bindings.length === 0) {
        return context.reply({
          content: 'Henüz ayarlanmış bir otomatik rol yok.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const lines = bindings.map((binding) => {
        const definition = getRoleTypeDefinition(binding.type);
        const label = definition?.label ?? 'Hedef';
        return `• **${label}** → <@&${binding.roleId}>`;
      });

      const embed = MessageHelper.createEmbed({
        title: 'Otomatik roller',
        description: lines.join('\n'),
        color: BotComponentColor.INFO,
      });

      return context.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'temizle') {
      const type = context.options.getString('hedef', true);

      try {
        const cleared = await guildRoleService.clearRole(
          context.guild.id,
          type,
        );

        if (!cleared) {
          return context.reply({
            content: 'Bu hedef için ayarlanmış bir rol bulunamadı.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const definition = getRoleTypeDefinition(type);
        const label = definition?.label ?? 'Hedef';

        return context.reply({
          content: `**${label}** otomatik rol ayarı kaldırıldı.`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        return context.reply({
          content:
            error instanceof Error
              ? error.message
              : 'Rol ayarı kaldırılırken bir hata oluştu.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};

export default SetRoleCommand;
