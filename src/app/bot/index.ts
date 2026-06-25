import { logger } from '@/infra/logger';
import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  Partials,
} from 'discord.js';
import { loadEvents } from './handlers/event.handler';
import { loadCommands } from './handlers/command.handler';

/**
 * @class VorlaxenBot
 * @extends {Client}
 * @description Discord client for handling interactions and lifecycle.
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
      partials: [Partials.GuildMember],
    });

    this.registerInternalEvents();
  }

  private registerInternalEvents(): void {
    this.once(Events.ClientReady, (readyClient) => {
      logger.info(`Bot Session established as ${readyClient.user.tag}`);
    });

    this.on(Events.Error, (error) => {
      logger.error({ err: error }, 'Bot Internal Discord error');
    });

    this.on(Events.Warn, (warning) => {
      logger.warn(`Bot Gateway warning: ${warning}`);
    });
  }

  public async start(token: string): Promise<void> {
    await loadEvents(this);
    await loadCommands(this);

    try {
      logger.info('Bot Initializing gateway connection...');
      await this.login(token);
    } catch (error) {
      logger.error({ err: error }, 'Bot Failed to login to Discord API');
      process.exit(1);
    }
  }
}

export const client = new VorlaxenBot();
