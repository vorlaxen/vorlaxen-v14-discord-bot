import { logger } from '@/infra/logger';
import { WorkerShutdownDeps } from '@/shared/types/bootstrap.type';
import { workerShutdown } from './shutdown';

export const registerWorkerSignals = (deps: WorkerShutdownDeps): void => {
  process.on('SIGINT', () => workerShutdown('SIGINT', deps));
  process.on('SIGTERM', () => workerShutdown('SIGTERM', deps));

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Worker: Unhandled Rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Worker: Uncaught Exception');
    workerShutdown('uncaughtException', deps);
  });
};
