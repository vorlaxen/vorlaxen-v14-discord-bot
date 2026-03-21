import path from 'path';
import { existsSync, readdirSync } from 'fs';
import logger from '@/infrastructure/logger';
import { BotEvent } from '@/shared/types/bot.type';
import { VorlaxenBot } from '..';

export async function loadEvents(client: VorlaxenBot): Promise<void> {
  const eventsPath = path.join(process.cwd(), 'src', 'modules', 'events');
  
  if (!existsSync(eventsPath)) {
    logger.warn(`[Handler] Events directory not found: ${eventsPath}`);
    return;
  }

  const eventFiles = readdirSync(eventsPath).filter(
    file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('.map')
  );

  for (const file of eventFiles) {
    try {
      const filePath = path.join(eventsPath, file);
      const eventModule = await import(filePath);
      const event: BotEvent<any> = eventModule.default || eventModule;

      if (event?.name) {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
        logger.info(`[Event] Loaded: ${event.name}`);
      }
    } catch (error) {
      logger.error(`[Event] Failed to load ${file}:`, error);
    }
  }
}