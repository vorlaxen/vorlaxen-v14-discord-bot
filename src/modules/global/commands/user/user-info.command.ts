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
  name: 'kullanici-bilgi',
  description: 'Bir kullanıcı hakkında detaylı bilgi raporu oluşturur.',
  aliases: ['kullanici', 'user', 'ui', 'whois', 'who', 'profil', 'user-info'],
  data: new SlashCommandBuilder()
    .setName('kullanici-bilgi')
    .setDescription('Kullanıcı kimliği ve erişim seviyeleri hakkında detaylı bir rapor oluşturur.')
    .addUserOption(option =>
      option.setName('hedef').setDescription('Bilgisi görüntülenecek kullanıcı.').setRequired(false)
    ),

  execute: async context => {
    const { guild } = context;
    if (!guild) return;

    const targetUser =
      'options' in context
        ? context.options.getUser('hedef') || context.user
        : context.mentions.users.first() || context.author;

    const user = await targetUser.fetch(true);
    const member = await guild.members.fetch(user.id).catch(() => null);

    const badgeMap: Record<string, string> = {
      Staff: 'Discord Personeli',
      Partner: 'Ortak Sunucu Sahibi',
      Hypesquad: 'HypeSquad Etkinlikleri',
      BugHunterLevel1: 'Hata Avcısı (Seviye 1)',
      BugHunterLevel2: 'Hata Avcısı (Seviye 2)',
      HypeSquadOnlineHouse1: 'Cesaret Evi',
      HypeSquadOnlineHouse2: 'Parlaklık Evi',
      HypeSquadOnlineHouse3: 'Denge Evi',
      PremiumEarlySupporter: 'Erken Destekçi',
      VerifiedBot: 'Doğrulanmış Bot',
      VerifiedDeveloper: 'Erken Doğrulanmış Geliştirici',
      ActiveDeveloper: 'Aktif Geliştirici',
    };
    const badges =
      user.flags
        ?.toArray()
        .map(f => badgeMap[f] || f)
        .join(', ') || 'Yok';

    const mainEmbed = MessageHelper.createEmbed({
      title: `Kullanıcı Bilgisi: ${user.tag}`,
      description: [
        `**Kullanıcı ID:** \`${user.id}\``,
        `**Durum:** ${member ? 'Sunucu Üyesi' : 'Sunucu Dışı'}`,
        '\u200B',
      ].join('\n'),
      thumbnail: user.displayAvatarURL({ size: 1024 }),
      image: user.bannerURL({ size: 1024 }) || undefined,
      color: member?.displayHexColor || BotComponentColor.PRIMARY,
      fields: [
        {
          name: 'Kimlik',
          value: [
            '\u200B',
            `**Kullanıcı Adı**`,
            `\`${user.username}\``,
            '',
            `**Rozetler**`,
            `${badges}`,
            '',
            `**Tür**`,
            `${user.bot ? 'Bot' : 'İnsan'}`,
            '\u200B',
          ].join('\n'),
          inline: true,
        },
        {
          name: 'Zaman Çizelgesi',
          value: [
            '\u200B',
            `**Hesap Oluşturma**`,
            `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`,
            '',
            `**Sunucuya Katılım**`,
            member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : '`Yok`',
            '',
            `**Hesap Yaşı**`,
            `${Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24 * 365))} yıl`,
            '\u200B',
          ].join('\n'),
          inline: true,
        },
      ],
    });

    const row = MessageHelper.createActionRow([
      new ButtonBuilder()
        .setCustomId('overview')
        .setLabel('Genel Bakış')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('permissions')
        .setLabel('Yetkiler')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('roles')
        .setLabel('Roller')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('status').setLabel('Durum').setStyle(ButtonStyle.Secondary),
    ]);

    const response = await context.reply({ embeds: [mainEmbed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000,
    });

    collector.on('collect', async i => {
      const commandUser = 'user' in context ? context.user : context.author;
      if (i.user.id !== commandUser.id) {
        return i.reply({ content: 'Bu menüyü yalnızca komutu kullanan kişi kullanabilir.', ephemeral: true });
      }

      let currentEmbed: any;

      switch (i.customId) {
        case 'overview':
          currentEmbed = mainEmbed;
          break;

        case 'permissions':
          if (!member)
            return i.reply({
              content: 'Sunucu dışı kullanıcılar için yetki bilgisi mevcut değil.',
              ephemeral: true,
            });

          const criticalPerms = [
            { flag: PermissionsBitField.Flags.Administrator, label: 'Yönetici' },
            { flag: PermissionsBitField.Flags.ManageGuild, label: 'Sunucuyu Yönet' },
            { flag: PermissionsBitField.Flags.BanMembers, label: 'Üye Yasaklama' },
            { flag: PermissionsBitField.Flags.ManageRoles, label: 'Rolleri Yönet' },
          ]
            .map(p => (member.permissions.has(p.flag) ? `+ \`${p.label}\`` : `- \`${p.label}\``))
            .join('\n');

          currentEmbed = MessageHelper.createEmbed({
            title: 'Kritik Yetki Analizi',
            description: `Yönetici yetkileri değerlendirmesi:\n\n${criticalPerms}`,
            color: BotComponentColor.PRIMARY,
          });
          break;

        case 'roles':
          if (!member) return i.reply({ content: 'Rol bilgisi mevcut değil.', ephemeral: true });
          const roles = member.roles.cache
            .filter(r => r.name !== '@everyone')
            .sort((a, b) => b.position - a.position);

          currentEmbed = MessageHelper.createEmbed({
            title: 'Rol Hiyerarşisi',
            description: `**En Yüksek Rol:** ${member.roles.highest}\n**Toplam Rol:** ${roles.size}\n\n${roles.map(r => r.toString()).join(' ')}`,
            color: member.displayHexColor,
          });
          break;

        case 'status':
          const voiceChannel = member?.voice.channel
            ? `${member.voice.channel.name}`
            : 'Bağlı değil';
          currentEmbed = MessageHelper.createEmbed({
            title: 'Aktif Durum Analizi',
            description: 'Anlık varlık ve sunucu etkileşimi değerlendirmesi.',
            fields: [
              { name: 'Ses Durumu', value: `\`${voiceChannel}\``, inline: true },
              {
                name: 'Sunucu Takviyecisi',
                value: member?.premiumSince ? 'Evet' : 'Hayır',
                inline: true,
              },
              {
                name: 'Avatar Süslemesi',
                value: user.avatarDecorationURL() ? 'Aktif' : 'Yok',
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
