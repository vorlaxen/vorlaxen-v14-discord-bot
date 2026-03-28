import {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { BotCommand } from '@/shared/types/bot.type';
import { BotComponentColor } from '@/config';
import { MessageHelper } from '@/shared/utils/bot';

const AvatarCommand: BotCommand = {
  name: 'avatar',
  description: 'Visual asset extraction and identification.',
  aliases: ['av', 'pfp', 'pp', 'icon', 'banner'],
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Extracts and displays user visual identification assets.')
    .addUserOption(option =>
      option.setName('target').setDescription('Select the user to analyze.').setRequired(false)
    ),

  execute: async context => {
    const targetUser =
      'options' in context
        ? context.options.getUser('target') || context.user
        : context.mentions.users.first() || context.author;

    const user = await targetUser.fetch(true);

    const avatarURL = user.displayAvatarURL({ size: 1024 });
    const bannerURL = user.bannerURL({ size: 1024 });

    const avatarEmbed = MessageHelper.createEmbed({
      title: `Visual Asset: ${user.tag}`,
      description: `**Asset Type:** Primary Identification (Avatar)\n**Format:** PNG/WebP @ 1024px`,
      image: avatarURL,
      color: BotComponentColor.PRIMARY
    });

    const row = MessageHelper.createActionRow([
      new ButtonBuilder()
        .setCustomId('view_avatar')
        .setLabel('Primary Avatar')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('view_banner')
        .setLabel('Profile Banner')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!bannerURL),
      new ButtonBuilder()
        .setLabel('Source Link')
        .setStyle(ButtonStyle.Link)
        .setURL(avatarURL),
    ]);

    const response = await context.reply({ embeds: [avatarEmbed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on('collect', async i => {
      const commandUser = 'user' in context ? context.user : context.author;
      if (i.user.id !== commandUser.id) {
        return i.reply({ content: 'Access denied. Unauthorized session.', ephemeral: true });
      }

      if (i.customId === 'view_avatar') {
        row.components[0].setDisabled(true).setStyle(ButtonStyle.Primary);
        row.components[1].setDisabled(false).setStyle(ButtonStyle.Secondary);
        (row.components[2] as any).setURL(avatarURL);

        await i.update({
          embeds: [avatarEmbed],
          components: [row]
        });
      } 
      else if (i.customId === 'view_banner' && bannerURL) {
        // Banner butonuna basıldığında
        row.components[0].setDisabled(false).setStyle(ButtonStyle.Secondary);
        row.components[1].setDisabled(true).setStyle(ButtonStyle.Primary);
        (row.components[2] as any).setURL(bannerURL);

        const bannerEmbed = MessageHelper.createEmbed({
          title: `Visual Asset: ${user.tag}`,
          description: `**Asset Type:** Extended Identity Banner\n**Format:** PNG/GIF @ 1024px`,
          image: bannerURL,
          color: BotComponentColor.PRIMARY
        });

        await i.update({
          embeds: [bannerEmbed],
          components: [row]
        });
      }
    });

    collector.on('end', () => {
      response.edit({ components: [] }).catch(() => null);
    });
  },
};

export default AvatarCommand;