import path from 'path';
import { existsSync, readdirSync } from 'fs';
import logger from '@/infrastructure/logger';
import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { BotCommand, BotEvent } from '@/shared/types/bot.type';

/**
 * @class VorlaxenBot
 * @extends {Client}
 * @description Core bot class for handling Discord interactions and life cycle.
 */
export class VorlaxenBot extends Client {
  public readonly commands: Collection<string, any> = new Collection();
  public readonly cooldowns: Collection<string, Collection<string, number>> = new Collection();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
      failIfNotExists: false,
    });

    this.registerInternalEvents();
  }

  /**
   * Registers basic lifecycle events for the client.
   * @private
   */
  private registerInternalEvents(): void {
    this.once(Events.ClientReady, readyClient => {
      logger.info(`Bot Session established as ${readyClient.user.tag}`);
    });

    this.on(Events.Error, error => {
      logger.error(`Bot Internal Discord error:`, error);
    });

    this.on(Events.Warn, warning => {
      logger.warn(`Bot Gateway warning: ${warning}`);
    });
  }

  public async loadEvents(): Promise<void> {
    const eventsPath = path.join(process.cwd(), 'src', 'modules', 'events');
    if (!existsSync(eventsPath)) {
      logger.warn(`Bot Events directory not found at: ${eventsPath}`);
      return;
    }

    if (!existsSync(eventsPath)) {
      logger.error(`Bot Critical Error: Events directory NOT found at ${eventsPath}`);
      return;
    }

    const eventFiles = readdirSync(eventsPath).filter(
      file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('.map')
    );

    if (eventFiles.length === 0) {
      logger.warn(`Bot No event files found in ${eventsPath}. Make sure files end with .ts`);
      return;
    }

    for (const file of eventFiles) {
      try {
        const filePath = path.join(eventsPath, file);

        const eventModule = await import(filePath);

        const event: BotEvent<any> = eventModule.default || eventModule;

        if (event && event.name) {
          if (event.once) {
            this.once(event.name, (...args) => event.execute(...args));
          } else {
            this.on(event.name, (...args) => event.execute(...args));
          }
          logger.info(`[Bot] Event Loaded: ${event.name}`);
        }
      } catch (error) {
        logger.error(`[Bot] Failed to load event ${file}:`, error);
      }
    }
  }

  public async loadCommands(): Promise<void> {
    const commandsPath = path.join(process.cwd(), 'src', 'modules', 'commands');
    if (!existsSync(commandsPath)) return;

    const commandFiles = readdirSync(commandsPath).filter(
      f => f.endsWith('.ts') || f.endsWith('.js')
    );

    for (const file of commandFiles) {
      const commandModule = await import(path.join(commandsPath, file));
      const command: BotCommand = commandModule.default || commandModule;

      if (command && command.name) {
        this.commands.set(command.name, command);

        if (command.aliases) {
          command.aliases.forEach(alias => this.commands.set(alias, command));
        }

        logger.info(`[Bot] Command Loaded: ${command.name}`);
      }
    }
  }

  /**
   * Initializes the bot connection to Discord Gateway.
   * @param {string} token - Discord Bot Token
   */
  public async start(token: string): Promise<void> {
    await this.loadEvents();
    await this.loadCommands();
    
    try {
      logger.info('Bot Initializing gateway connection...');
      await this.login(token);
    } catch (error) {
      logger.error('Bot Failed to login to Discord API:', error);
      process.exit(1);
    }
  }
}

export const client = new VorlaxenBot();
