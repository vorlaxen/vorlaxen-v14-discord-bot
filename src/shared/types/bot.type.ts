import {
  ClientEvents,
  ChatInputCommandInteraction,
  Message,
  SlashCommandBuilder,
  PermissionResolvable,
} from 'discord.js';

export interface BotEvent<T extends keyof ClientEvents> {
  name: T;
  once?: boolean;
  execute: (...args: ClientEvents[T]) => Promise<void> | void;
}

export interface CommandSettings {
  ownerRequired?: boolean;
  adminRequired?: boolean;
  mainGuildOnly?: boolean;
  cooldown?: number;
  deleteTime?: number;
}

export interface BotCommand {
  name: string;
  description: string;
  category?: string;
  usage?: string;
  aliases?: string[];
  settings?: CommandSettings;
  data?: SlashCommandBuilder | any;
  execute: (context: Message | ChatInputCommandInteraction, args: string[]) => Promise<any>;
}
