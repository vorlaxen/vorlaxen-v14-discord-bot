import { AppConfig } from '@/config';
import { redisService } from '@/infra/cache';
import { bullMQManager } from '@/infra/cache/adapters/bullmq.adapter';
import { backgroundWorkerService } from '@/infra/queue/services/background/background-worker.service';
import { logger } from '@/infra/logger';
import { registerWorkerSignals } from './signals';

export const bootstrapWorker = async (): Promise<void> => {
  try {
    logger.info(
      `Worker: Starting ${AppConfig.appName} queue consumers (${AppConfig.isProd ? 'production' : 'development'})...`,
    );

    await redisService.connect();
    backgroundWorkerService.start();

    registerWorkerSignals({ bullmq: bullMQManager });

    logger.info('Worker: Queue consumers are ready and accepting jobs.');
  } catch (err) {
    logger.fatal({ err }, 'Worker: Bootstrap failed. Exiting...');
    process.exit(1);
  }
};
