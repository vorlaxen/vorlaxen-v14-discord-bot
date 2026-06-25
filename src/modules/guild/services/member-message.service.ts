import {
  Guild,
  GuildMember,
  PartialGuildMember,
  TextChannel,
  User,
} from 'discord.js';
import { logger } from '@/infra/logger';
import { BotComponentColor } from '@/config';
import { MessageHelper } from '@/shared/utils/bot';
import {
  getChannelTypeDefinition,
  isValidChannelType,
} from '../constants/channel-type.registry';
import { GuildChannelType } from '../constants/channel-types.constant';
import { guildService } from './guild.service';
import { guildChannelService } from './guild-channel.service';
import { renderTemplate } from '../utils/template.util';

export class MemberMessageService {
  private static instance: MemberMessageService;

  private constructor() {}

  static getInstance(): MemberMessageService {
    if (!MemberMessageService.instance) {
      MemberMessageService.instance = new MemberMessageService();
    }
    return MemberMessageService.instance;
  }

  async sendMemberEvent(
    discordGuild: Guild,
    member: GuildMember | PartialGuildMember | User,
    type: GuildChannelType,
  ): Promise<void> {
    if (!isValidChannelType(type)) return;

    try {
      const binding = await guildChannelService.getChannelBinding(
        discordGuild.id,
        type,
      );
      if (!binding) return;

      const channel = await discordGuild.channels
        .fetch(binding.channelId)
        .catch(() => null);

      if (!channel || !channel.isTextBased()) {
        logger.warn(
          { guildId: discordGuild.id, channelId: binding.channelId, type },
          'MemberMessageService: Configured channel not found or not text-based',
        );
        return;
      }

      const guildRecord = await guildService.findByDiscordId(discordGuild.id);
      const definition = getChannelTypeDefinition(type)!;
      const messageConfig = guildRecord?.data.messages?.[type];

      const template =
        messageConfig?.template ?? definition.defaultTemplate;
      const useEmbed =
        messageConfig?.useEmbed ?? definition.defaultUseEmbed;

      const user =
        member instanceof GuildMember
          ? member.user
          : member instanceof User
            ? member
            : (member as PartialGuildMember).user;

      if (!user) return;

      const content = renderTemplate(template, {
        user: member instanceof GuildMember ? member : user,
        guild: discordGuild,
      });

      const textChannel = channel as TextChannel;

      if (useEmbed) {
        const embed = MessageHelper.createEmbed({
          description: content,
          color:
            type === 'member_join'
              ? BotComponentColor.SUCCESS
              : BotComponentColor.SECONDARY,
          thumbnail: user.displayAvatarURL(),
        });
        await textChannel.send({ embeds: [embed] });
      } else {
        await textChannel.send({ content });
      }

      logger.info(
        { guildId: discordGuild.id, type, channelId: binding.channelId },
        'MemberMessageService: Message sent',
      );
    } catch (error) {
      logger.error(
        { err: error, guildId: discordGuild.id, type },
        'MemberMessageService: Failed to send member event message',
      );
    }
  }
}

export const memberMessageService = MemberMessageService.getInstance();
