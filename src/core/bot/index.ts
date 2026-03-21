import logger from '@/infrastructure/logger';
import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { loadEvents } from './handlers/event.handler';
import { loadCommands } from './handlers/command.handler';

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

  /**
   * Initializes the bot connection to Discord Gateway.
   * @param {string} token - Discord Bot Token
   */
  public async start(token: string): Promise<void> {
    await loadEvents(this);
    await loadCommands(this);

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
