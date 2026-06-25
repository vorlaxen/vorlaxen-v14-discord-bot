import { logger } from '@/infra/logger';
import { shutdown } from './shutdown';
import { ShutdownDeps } from '@/shared/types/bootstrap.type';

export const registerSignals = (deps: ShutdownDeps) => {
  process.on('SIGINT', () => shutdown('SIGINT', deps));
  process.on('SIGTERM', () => shutdown('SIGTERM', deps));

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled Rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught Exception');
  });
};
