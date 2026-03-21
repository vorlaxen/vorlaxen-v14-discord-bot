import { BotComponentColor } from '@/config';
import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ColorResolvable, 
  APIEmbedField,
  CommandInteraction,
} from 'discord.js';

export interface EmbedOptions {
  title?: string;
  description: string;
  color?: ColorResolvable;
  fields?: APIEmbedField[];
  thumbnail?: string;
  image?: string;
  author?: { name: string; iconURL?: string };
}

export class MessageHelper {
  private static readonly SYSTEM_NAME = 'Vorlaxen';
  private static readonly FOOTER_ICON = 'https://img.freepik.com/free-vector/illustration-share-icon_53876-5622.jpg';

  public static createEmbed({ title, description, color, fields, thumbnail, image, author }: EmbedOptions) {
    const embed = new EmbedBuilder()
      .setColor(color || BotComponentColor.PRIMARY)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ 
        text: `${this.SYSTEM_NAME} • İşlem Merkezi`, 
        iconURL: this.FOOTER_ICON 
      });

    if (title) embed.setTitle(`${title}`);
    if (fields) embed.addFields(fields);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);
    if (author) embed.setAuthor(author);

    return embed;
  }

  public static async thinking(interaction: CommandInteraction, ephemeral: boolean = true) {
    const embed = new EmbedBuilder()
      .setColor(BotComponentColor.PROCESS)
      .setDescription('<a:loading:1234567890> **|** Talebiniz doğrulanıyor, lütfen bekleyin...')
      .setFooter({ text: 'İşlem Sırasında...' + this.SYSTEM_NAME });

    return await interaction.reply({ embeds: [embed], ephemeral });
  }

  public static success(message: string) {
    return this.createEmbed({
      description: `**Başarılı!**\n${message}`,
      color: 0x2ECC71 
    });
  }

  public static error(message: string) {
    return this.createEmbed({
      description: `**Hata Oluştu!**\n${message}`,
      color: 0xE74C3C
    }).setTitle('Sistem Hatası');
  }

  public static createActionRow(buttons: ButtonBuilder[]) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
  }

  public static confirmationRow(confirmId: string, cancelId: string) {
    return this.createActionRow([
      new ButtonBuilder()
        .setCustomId(confirmId)
        .setLabel('İşlemi Onayla')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✔️'),
      new ButtonBuilder()
        .setCustomId(cancelId)
        .setLabel('Vazgeç')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('✖️')
    ]);
  }

  public static linkButton(label: string, url: string) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(label)
        .setURL(url)
        .setStyle(ButtonStyle.Link)
    );
  }
}