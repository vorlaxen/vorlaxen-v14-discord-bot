import path from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import logger from '@/infrastructure/logger';
import { VorlaxenBot } from '..';
import { BotCommand } from '@/shared/types/bot.type';
import { REST, Routes } from 'discord.js';
import { botClientConfig, RuntimeConfig } from '@/config';

function getRecursiveFiles(dirPath: string): string[] {
  let results: string[] = [];
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

export async function deploySlashCommands(commands: BotCommand[]) {
  const slashCommands = commands
    .filter(cmd => cmd.execute)
    .map(cmd => cmd.data.toJSON());

  if (slashCommands.length === 0) {
    logger.warn('[DeploymentManager] No valid slash commands identified for synchronization.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(botClientConfig.token);

  try {
    const targetScope = RuntimeConfig.isProd ? 'Global' : 'Guild';
    logger.info(`[DeploymentManager] Initiating ${targetScope} synchronization for ${slashCommands.length} commands.`);

    const route = RuntimeConfig.isProd
        ? Routes.applicationCommands(botClientConfig.clientId)
        : Routes.applicationGuildCommands(botClientConfig.clientId, botClientConfig.testGuildId);

    await rest.put(route, { body: slashCommands });

    logger.info('[DeploymentManager] Command synchronization completed successfully.');
  } catch (error) {
    logger.error('[DeploymentManager] Failed to synchronize application commands.', { error });
  }
}

export async function loadCommands(client: VorlaxenBot): Promise<void> {
  const modulesPath = path.join(process.cwd(), 'src', 'modules');

  if (!existsSync(modulesPath)) {
    logger.warn('[CommandHandler] Target module directory not found.', { path: modulesPath });
    return;
  }

  const moduleDirs = readdirSync(modulesPath);
  let allCommandFiles: string[] = [];

  for (const moduleName of moduleDirs) {
    const commandsPath = path.join(modulesPath, moduleName, 'commands');

    if (existsSync(commandsPath) && statSync(commandsPath).isDirectory()) {
      const files = getRecursiveFiles(commandsPath);
      allCommandFiles = allCommandFiles.concat(files);
      logger.info(`[CommandHandler] Module discovered: ${moduleName}`, { fileCount: files.length });
    }
  }

  const legacyPath = path.join(modulesPath, 'commands');
  if (existsSync(legacyPath)) {
    allCommandFiles = allCommandFiles.concat(getRecursiveFiles(legacyPath));
  }

  for (const filePath of allCommandFiles) {
    try {
      const commandModule = await import(filePath);
      const command: BotCommand = commandModule.default || commandModule;

      if (command && command.name) {
        const pathParts = filePath.split(path.sep);
        const moduleIndex = pathParts.indexOf('modules');
        command.category = moduleIndex !== -1 ? pathParts[moduleIndex + 1] : 'general';

        client.commands.set(command.name, command);

        if (command.aliases) {
          command.aliases.forEach(alias => client.commands.set(alias, command));
        }

        logger.info(`[CommandHandler] Command registered: ${command.name}`, { 
          category: command.category, 
          aliases: command.aliases?.length || 0 
        });
      }
    } catch (error) {
      logger.error('[CommandHandler] Integrity error during command registration.', { 
        source: filePath, 
        error 
      });
    }
  }

  const commandArray = Array.from(client.commands.values());
  const uniqueCommands = [...new Set(commandArray)];
  await deploySlashCommands(uniqueCommands);
}