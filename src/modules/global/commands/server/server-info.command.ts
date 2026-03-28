import {
  SlashCommandBuilder,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { BotCommand } from '@/shared/types/bot.type';
import { BotComponentColor } from '@/config';
import { MessageHelper } from '@/shared/utils/bot';

const ServerCommand: BotCommand = {
  name: 'server-info',
  description: 'Provides a corporate-level analysis report of the server.',
  aliases: ['server', 'server-info', 'si', 'stats'],
  data: new SlashCommandBuilder()
    .setName('server-info')
    .setDescription('Generates a detailed report about server structure and security.'),

  execute: async context => {
    const { guild } = context;
    if (!guild) return;

    const user = 'user' in context ? context.user : context.author;

    const channels = guild.channels.cache;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const verificationLevels = ['None', 'Low', 'Medium', 'High', 'Very High'];
    const mfaLevels = ['Disabled', 'Enabled'];

    const mainEmbed = MessageHelper.createEmbed({
      title: `${guild.name}`,
      description: [
        `> ${guild.description || '*No server description available.*'}`,
      ].join('\n'),
      thumbnail: guild.iconURL({ size: 1024 }) || '',
      color: BotComponentColor.PRIMARY,
      fields: [
        {
          name: 'General Information',
          value: [
            '',
            `**Owner**`,
            `<@${guild.ownerId}>`,
            '',
            `**Server ID**`,
            `\`${guild.id}\``,
            '',
            `**Created At**`,
            `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
          ].join('\n'),
          inline: true,
        },
        {
          name: 'Statistics',
          value: [
            '',
            `**Members**`,
            `\`${guild.memberCount}\``,
            '',
            `**Boosts**`,
            `\`${boostCount}\``,
            '',
            `**Tier**`,
            `\`${guild.premiumTier}\``,
            '',
          ].join('\n'),
          inline: true,
        },
        {
          name: 'Security',
          value: [
            '',
            `**Verification Level**`,
            `\`${verificationLevels[guild.verificationLevel]}\``,
            '',
            `**2FA Requirement**`,
            `\`${mfaLevels[guild.mfaLevel]}\``,
            '',
          ].join('\n'),
          inline: false,
        },
      ],
    });

    const row = MessageHelper.createActionRow([
      new ButtonBuilder()
        .setCustomId('main')
        .setLabel('Overview')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('stats')
        .setLabel('Configuration')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('roles')
        .setLabel('Hierarchy')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('security')
        .setLabel('Security')
        .setStyle(ButtonStyle.Secondary),
    ]);

    const response = await context.reply({ embeds: [mainEmbed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000,
    });

    collector.on('collect', async i => {
      if (i.user.id !== user.id)
        return i.reply({ content: 'This session is not assigned to you.', ephemeral: true });

      let currentEmbed: any;

      switch (i.customId) {
        case 'main':
          currentEmbed = mainEmbed;
          break;

        case 'stats':
          currentEmbed = MessageHelper.createEmbed({
            title: `System Configuration`,
            description: 'Channel architecture and media asset distribution report.\n\u200B',
            color: BotComponentColor.PRIMARY,
            fields: [
              {
                name: 'Channel Inventory',
                value: `• Text Channels: \`${channels.filter(c => c.type === ChannelType.GuildText).size}\`\n\n• Voice Channels: \`${channels.filter(c => c.type === ChannelType.GuildVoice).size}\`\n\n• Categories: \`${channels.filter(c => c.type === ChannelType.GuildCategory).size}\``,
                inline: true,
              },
              {
                name: 'Media Assets',
                value: `• Emojis: \`${guild.emojis.cache.size}\`\n\n• Stickers: \`${guild.stickers.cache.size}\`\n\n• Server Banner: \`${guild.banner ? 'Available' : 'Not Set'}\``,
                inline: true,
              },
            ],
          });
          break;

        case 'roles':
          const roles = guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .filter(r => r.name !== '@everyone');

          const rolesArray = Array.from(roles.values());

          const rolesDisplay =
            rolesArray.length > 15
              ? `${rolesArray
                  .slice(0, 15)
                  .map(r => r.toString())
                  .join(
                    ', '
                  )}\n\n*Note: ${rolesArray.length - 15} more roles are not displayed.*`
              : rolesArray.map(r => r.toString()).join(', ') || 'No roles defined.';

          currentEmbed = MessageHelper.createEmbed({
            title: `Hierarchy & Role Management`,
            description: `There are a total of **${rolesArray.length}** role groups in the system.\n\n${rolesDisplay}`,
            color: BotComponentColor.PRIMARY,
          });
          break;

        case 'security':
          currentEmbed = MessageHelper.createEmbed({
            title: 'Security & Data Privacy',
            description: 'Server moderation and content filtering standards.\n\u200B',
            color: BotComponentColor.PRIMARY,
            fields: [
              {
                name: 'Content Filter',
                value: `\`${guild.explicitContentFilter === 0 ? 'Disabled' : 'Enabled (Auto Scan)'}\``,
                inline: true,
              },
              {
                name: 'Notification Level',
                value: `\`${guild.defaultMessageNotifications === 0 ? 'All Messages' : 'Mentions Only'}\``,
                inline: true,
              },
              {
                name: 'NSFW Access Level',
                value: `\`Level: ${guild.nsfwLevel}\``,
                inline: true,
              },
            ],
          });
          break;
      }

      await i.update({ embeds: [currentEmbed] });
    });
  },
};

export default ServerCommand;