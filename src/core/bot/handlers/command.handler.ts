import path from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import logger from '@/infrastructure/logger';
import { VorlaxenBot } from '..';
import { BotCommand } from '@/shared/types/bot.type';
import { REST, Routes } from 'discord.js';
import { botClientConfig } from '@/config';

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
    .map(cmd => {
      return cmd.data.toJSON();
    });

  if (slashCommands.length === 0) {
    logger.warn('[Deploy] Yüklenecek Slash komutu bulunamadı.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(botClientConfig.token);

  try {
    logger.info(`[Deploy] ${slashCommands.length} adet Slash komutu test sunucusuna yükleniyor...`);

    await rest.put(
      Routes.applicationGuildCommands(botClientConfig.clientId, botClientConfig.testGuildId),
      { body: slashCommands }
    );

    logger.info('[Deploy] Slash komutları başarıyla test sunucusuna yüklendi!');
  } catch (error) {
    logger.error('[Deploy] Komutlar yüklenirken hata oluştu:', error);
  }
}

export async function loadCommands(client: VorlaxenBot): Promise<void> {
  const commandsPath = path.join(process.cwd(), 'src', 'modules', 'commands');

  if (!existsSync(commandsPath)) {
    logger.warn(`[Handler] Commands directory NOT found: ${commandsPath}`);
    return;
  }

  const commandFiles = getRecursiveFiles(commandsPath);

  for (const filePath of commandFiles) {
    try {
      const commandModule = await import(filePath);
      const command: BotCommand = commandModule.default || commandModule;

      if (command && command.name) {
        const relativePath = path.relative(commandsPath, filePath);
        const pathParts = path.dirname(relativePath).split(path.sep);

        command.category = pathParts[0] === '.' ? 'general' : pathParts.join(':');

        client.commands.set(command.name, command);

        if (command.aliases) {
          command.aliases.forEach(alias => client.commands.set(alias, command));
        }

        logger.info(`[Command] Loaded [${command.category}] ${command.name}`);
      }
    } catch (error) {
      logger.error(`[Command] Critical error loading ${filePath}:`, error);
    }
  }

  const commandArray = Array.from(client.commands.values());
  const uniqueCommands = [...new Set(commandArray)];
  await deploySlashCommands(uniqueCommands);
}
