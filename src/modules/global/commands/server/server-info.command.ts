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
  name: 'sunucu-bilgi',
  description: 'Sunucu hakkında detaylı bir analiz raporu sunar.',
  aliases: ['sunucu', 'server', 'server-info', 'si', 'stats'],
  data: new SlashCommandBuilder()
    .setName('sunucu-bilgi')
    .setDescription('Sunucu yapısı ve güvenliği hakkında detaylı bir rapor oluşturur.'),

  execute: async context => {
    const { guild } = context;
    if (!guild) return;

    const user = 'user' in context ? context.user : context.author;

    const channels = guild.channels.cache;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const verificationLevels = ['Yok', 'Düşük', 'Orta', 'Yüksek', 'Çok Yüksek'];
    const mfaLevels = ['Kapalı', 'Açık'];

    const mainEmbed = MessageHelper.createEmbed({
      title: `${guild.name}`,
      description: [
        `> ${guild.description || '*Sunucu açıklaması bulunmuyor.*'}`,
      ].join('\n'),
      thumbnail: guild.iconURL({ size: 1024 }) || '',
      color: BotComponentColor.PRIMARY,
      fields: [
        {
          name: 'Genel Bilgiler',
          value: [
            '',
            `**Sahip**`,
            `<@${guild.ownerId}>`,
            '',
            `**Sunucu ID**`,
            `\`${guild.id}\``,
            '',
            `**Oluşturulma Tarihi**`,
            `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
          ].join('\n'),
          inline: true,
        },
        {
          name: 'İstatistikler',
          value: [
            '',
            `**Üyeler**`,
            `\`${guild.memberCount}\``,
            '',
            `**Takviyeler**`,
            `\`${boostCount}\``,
            '',
            `**Seviye**`,
            `\`${guild.premiumTier}\``,
            '',
          ].join('\n'),
          inline: true,
        },
        {
          name: 'Güvenlik',
          value: [
            '',
            `**Doğrulama Seviyesi**`,
            `\`${verificationLevels[guild.verificationLevel]}\``,
            '',
            `**2FA Zorunluluğu**`,
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
        .setLabel('Genel Bakış')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('stats')
        .setLabel('Yapılandırma')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('roles')
        .setLabel('Hiyerarşi')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('security')
        .setLabel('Güvenlik')
        .setStyle(ButtonStyle.Secondary),
    ]);

    const response = await context.reply({ embeds: [mainEmbed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000,
    });

    collector.on('collect', async i => {
      if (i.user.id !== user.id)
        return i.reply({ content: 'Bu menüyü yalnızca komutu kullanan kişi kullanabilir.', ephemeral: true });

      let currentEmbed: any;

      switch (i.customId) {
        case 'main':
          currentEmbed = mainEmbed;
          break;

        case 'stats':
          currentEmbed = MessageHelper.createEmbed({
            title: `Sistem Yapılandırması`,
            description: 'Kanal yapısı ve medya varlıkları dağılım raporu.\n\u200B',
            color: BotComponentColor.PRIMARY,
            fields: [
              {
                name: 'Kanal Envanteri',
                value: `• Metin Kanalları: \`${channels.filter(c => c.type === ChannelType.GuildText).size}\`\n\n• Ses Kanalları: \`${channels.filter(c => c.type === ChannelType.GuildVoice).size}\`\n\n• Kategoriler: \`${channels.filter(c => c.type === ChannelType.GuildCategory).size}\``,
                inline: true,
              },
              {
                name: 'Medya Varlıkları',
                value: `• Emojiler: \`${guild.emojis.cache.size}\`\n\n• Çıkartmalar: \`${guild.stickers.cache.size}\`\n\n• Sunucu Afişi: \`${guild.banner ? 'Mevcut' : 'Ayarlanmamış'}\``,
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
                  )}\n\n*Not: ${rolesArray.length - 15} rol daha gösterilmiyor.*`
              : rolesArray.map(r => r.toString()).join(', ') || 'Tanımlı rol bulunmuyor.';

          currentEmbed = MessageHelper.createEmbed({
            title: `Hiyerarşi ve Rol Yönetimi`,
            description: `Sistemde toplam **${rolesArray.length}** rol grubu bulunuyor.\n\n${rolesDisplay}`,
            color: BotComponentColor.PRIMARY,
          });
          break;

        case 'security':
          currentEmbed = MessageHelper.createEmbed({
            title: 'Güvenlik ve Veri Gizliliği',
            description: 'Sunucu moderasyonu ve içerik filtreleme standartları.\n\u200B',
            color: BotComponentColor.PRIMARY,
            fields: [
              {
                name: 'İçerik Filtresi',
                value: `\`${guild.explicitContentFilter === 0 ? 'Kapalı' : 'Açık (Otomatik Tarama)'}\``,
                inline: true,
              },
              {
                name: 'Bildirim Seviyesi',
                value: `\`${guild.defaultMessageNotifications === 0 ? 'Tüm Mesajlar' : 'Yalnızca Bahsetmeler'}\``,
                inline: true,
              },
              {
                name: 'NSFW Erişim Seviyesi',
                value: `\`Seviye: ${guild.nsfwLevel}\``,
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
