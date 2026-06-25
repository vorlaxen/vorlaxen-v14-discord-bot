import { logger } from '@/infra/logger';
import { AppConfig, botClientConfig } from '@/config';
import { registerSignals } from './signals';
import { DatabaseService } from '@/infra/database';
import { redisService } from '@/infra/cache';
import { bullMQManager } from '@/infra/cache/adapters/bullmq.adapter';
import { client } from '../bot';

export const bootstrap = async (): Promise<void> => {
  try {
    logger.info(
      `Starting ${AppConfig.appName} in ${AppConfig.isProd ? 'production' : 'development'} mode...`,
    );

    logger.info('Bootstrap: Initializing infrastructure components...');

    await DatabaseService.initialize();
    await redisService.connect();
    await client.start(botClientConfig.token);

    registerSignals({
      redis: redisService,
      db: DatabaseService,
      bullmq: bullMQManager,
      bot: client,
    });

    logger.info('Bootstrap: completed successfully. Bot is online.');
  } catch (err) {
    logger.fatal(
      { err },
      'Bootstrap: Critical error during application bootstrap! Shutting down...',
    );
    process.exit(1);
  }
};
