import {
  ClientEvents,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  Message,
  SlashCommandBuilder,
} from 'discord.js';

export interface BotEvent<T extends keyof ClientEvents> {
  name: T;
  once?: boolean;
  execute: (...args: ClientEvents[T]) => Promise<void> | void;
}

export interface CommandSettings {
  ownerRequired?: boolean;
  adminRequired?: boolean;
  manageGuildRequired?: boolean;
  mainGuildOnly?: boolean;
  disabled?: boolean;
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
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  execute: (
    context: Message | ChatInputCommandInteraction,
    args?: string[] | any,
  ) => Promise<any>;
}
