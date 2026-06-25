import { logger } from '@/infra/logger';
import { ShutdownDeps } from '@/shared/types/bootstrap.type';

export const shutdown = async (signal: string, deps: ShutdownDeps) => {
  try {
    logger.info(`Received ${signal}. Shutting down...`);

    await Promise.all([
      deps.bullmq.shutdown(),
      deps.redis.disconnect(),
      deps.db.close(),
    ]);

    await deps.bot.destroy();

    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Shutdown error');
    process.exit(1);
  }
};
