import { logger } from '@/infra/logger';
import { redisService } from '@/infra/cache';
import { WorkerShutdownDeps } from '@/shared/types/bootstrap.type';

export const workerShutdown = async (
  signal: string,
  deps: WorkerShutdownDeps,
): Promise<void> => {
  try {
    logger.info(`Worker: Received ${signal}. Initiating graceful shutdown...`);

    await Promise.allSettled([
      deps.bullmq.shutdown(),
      redisService.disconnect(),
    ]);

    logger.info('Worker: Shutdown completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Worker: Shutdown error');
    process.exit(1);
  }
};
