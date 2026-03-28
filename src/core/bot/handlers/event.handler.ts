import path from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import logger from '@/infrastructure/logger';
import { BotEvent } from '@/shared/types/bot.type';
import { VorlaxenBot } from '..';

function getRecursiveFiles(dirPath: string): string[] {
  let results: string[] = [];
  if (!existsSync(dirPath)) return results;

  const list = readdirSync(dirPath);
  list.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getRecursiveFiles(filePath));
    } else {
      if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('.map')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

export async function loadEvents(client: VorlaxenBot): Promise<void> {
  const modulesPath = path.join(process.cwd(), 'src', 'modules');

  if (!existsSync(modulesPath)) {
    logger.warn('[EventManager] Module root directory not detected.', { path: modulesPath });
    return;
  }

  const moduleDirs = readdirSync(modulesPath);
  let allEventFiles: string[] = [];

  for (const moduleName of moduleDirs) {
    const eventsPath = path.join(modulesPath, moduleName, 'events');
    
    if (existsSync(eventsPath) && statSync(eventsPath).isDirectory()) {
      const files = getRecursiveFiles(eventsPath);
      allEventFiles = allEventFiles.concat(files);
      logger.info(`[EventManager] Module scan completed: ${moduleName}`, { eventCount: files.length });
    }
  }

  const legacyEventsPath = path.join(modulesPath, 'events');
  if (existsSync(legacyEventsPath)) {
    allEventFiles = allEventFiles.concat(getRecursiveFiles(legacyEventsPath));
  }

  for (const filePath of allEventFiles) {
    try {
      const eventModule = await import(filePath);
      const event: BotEvent<any> = eventModule.default || eventModule;

      if (event?.name) {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
        
        const fileName = path.basename(filePath);
        logger.info(`[EventManager] Listener established: ${event.name}`, { 
          source: fileName, 
          mode: event.once ? 'ONCE' : 'ON' 
        });
      }
    } catch (error) {
      logger.error('[EventManager] Failed to initialize event listener.', { 
        source: filePath, 
        error 
      });
    }
  }
}