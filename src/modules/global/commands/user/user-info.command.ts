import {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionsBitField,
} from 'discord.js';
import { BotCommand } from '@/shared/types/bot.type';
import { BotComponentColor } from '@/config';
import { MessageHelper } from '@/shared/utils/bot';

const UserInfoCommand: BotCommand = {
  name: 'user-info',
  description: 'Comprehensive corporate-level analysis of a user identity.',
  aliases: ['user', 'ui', 'whois', 'who', 'profile'],
  data: new SlashCommandBuilder()
    .setName('user-info')
    .setDescription('Generates a detailed report about user identity and access levels.')
    .addUserOption(option =>
      option.setName('target').setDescription('Select the user to analyze.').setRequired(false)
    ),

  execute: async context => {
    const { guild } = context;
    if (!guild) return;

    const targetUser =
      'options' in context
        ? context.options.getUser('target') || context.user
        : context.mentions.users.first() || context.author;

    const user = await targetUser.fetch(true);
    const member = await guild.members.fetch(user.id).catch(() => null);

    const badgeMap: Record<string, string> = {
      Staff: 'Discord Staff',
      Partner: 'Partnered Server Owner',
      Hypesquad: 'HypeSquad Events',
      BugHunterLevel1: 'Bug Hunter Tier 1',
      BugHunterLevel2: 'Bug Hunter Tier 2',
      HypeSquadOnlineHouse1: 'House of Bravery',
      HypeSquadOnlineHouse2: 'House of Brilliance',
      HypeSquadOnlineHouse3: 'House of Balance',
      PremiumEarlySupporter: 'Early Supporter',
      VerifiedBot: 'Verified Bot',
      VerifiedDeveloper: 'Early Verified Developer',
      ActiveDeveloper: 'Active Developer',
    };
    const badges =
      user.flags
        ?.toArray()
        .map(f => badgeMap[f] || f)
        .join(', ') || 'None';

    // --- MAIN OVERVIEW EMBED ---
    const mainEmbed = MessageHelper.createEmbed({
      title: `Identity Analysis: ${user.tag}`,
      // Added spacing between Global ID and Status
      description: [
        `**Global ID:** \`${user.id}\``,
        `**Status:** ${member ? 'Internal Personnel' : 'External Entity'}`,
        '\u200B', // Forces a gap before the fields start
      ].join('\n'),
      thumbnail: user.displayAvatarURL({ size: 1024 }),
      image: user.bannerURL({ size: 1024 }) || undefined,
      color: member?.displayHexColor || BotComponentColor.PRIMARY,
      fields: [
        {
          name: 'Identification',
          value: [
            '\u200B', // Invisible top buffer
            `**Username**`,
            `\`${user.username}\``,
            '',
            `**Badges**`,
            `${badges}`,
            '',
            `**Type**`,
            `${user.bot ? 'Automated Unit' : 'Organic'}`,
            '\u200B', // Bottom buffer
          ].join('\n'),
          inline: true,
        },
        {
          name: 'Chronology',
          value: [
            '\u200B', // Invisible top buffer
            `**Registered**`,
            `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`,
            '',
            `**Joined**`,
            member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : '`N/A`',
            '',
            `**Account Age**`,
            `${Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24 * 365))} Years`,
            '\u200B', // Bottom buffer
          ].join('\n'),
          inline: true,
        },
      ],
    });

    const row = MessageHelper.createActionRow([
      new ButtonBuilder()
        .setCustomId('overview')
        .setLabel('Overview')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('permissions')
        .setLabel('Access Control')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('roles')
        .setLabel('Hierarchy')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('status').setLabel('Status').setStyle(ButtonStyle.Secondary),
    ]);

    const response = await context.reply({ embeds: [mainEmbed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000,
    });

    collector.on('collect', async i => {
      const commandUser = 'user' in context ? context.user : context.author;
      if (i.user.id !== commandUser.id) {
        return i.reply({ content: 'Access denied. Unauthorized session.', ephemeral: true });
      }

      let currentEmbed: any;

      switch (i.customId) {
        case 'overview':
          currentEmbed = mainEmbed;
          break;

        case 'permissions':
          if (!member)
            return i.reply({
              content: 'Permission data unavailable for external entities.',
              ephemeral: true,
            });

          const criticalPerms = [
            { flag: PermissionsBitField.Flags.Administrator, label: 'Admin' },
            { flag: PermissionsBitField.Flags.ManageGuild, label: 'Manage Guild' },
            { flag: PermissionsBitField.Flags.BanMembers, label: 'Ban Rights' },
            { flag: PermissionsBitField.Flags.ManageRoles, label: 'Manage Roles' },
          ]
            .map(p => (member.permissions.has(p.flag) ? `+ \`${p.label}\`` : `- \`${p.label}\``))
            .join('\n');

          currentEmbed = MessageHelper.createEmbed({
            title: 'Critical Access Analysis',
            description: `Personnel administrative evaluation:\n\n${criticalPerms}`,
            color: BotComponentColor.PRIMARY,
          });
          break;

        case 'roles':
          if (!member) return i.reply({ content: 'Hierarchy data unavailable.', ephemeral: true });
          const roles = member.roles.cache
            .filter(r => r.name !== '@everyone')
            .sort((a, b) => b.position - a.position);

          currentEmbed = MessageHelper.createEmbed({
            title: 'Hierarchy & Role Distribution',
            description: `**Highest Role:** ${member.roles.highest}\n**Total Roles:** ${roles.size}\n\n${roles.map(r => r.toString()).join(' ')}`,
            color: member.displayHexColor,
          });
          break;

        case 'status':
          const voiceChannel = member?.voice.channel
            ? `${member.voice.channel.name}`
            : 'Disconnected';
          currentEmbed = MessageHelper.createEmbed({
            title: 'Active Status Analysis',
            description: 'Evaluation of real-time presence and server engagement.',
            fields: [
              { name: 'Voice Status', value: `\`${voiceChannel}\``, inline: true },
              {
                name: 'Server Booster',
                value: member?.premiumSince ? 'Confirmed' : 'None',
                inline: true,
              },
              {
                name: 'Decoration',
                value: user.avatarDecorationURL() ? 'Active' : 'None',
                inline: true,
              },
            ],
            color: BotComponentColor.PRIMARY,
          });
          break;
      }

      await i.update({ embeds: [currentEmbed] });
    });
  },
};

export default UserInfoCommand;
