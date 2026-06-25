import { Job } from 'bullmq';
import { logger } from '@/infra/logger';
import {
  BackgroundJobPayload,
  BackgroundJobResult,
} from '../../types/background-job.type';

export async function processBackgroundJob(
  job: Job<BackgroundJobPayload, BackgroundJobResult>,
): Promise<BackgroundJobResult> {
  const { action, data, meta } = job.data;
  const correlationId = meta?.correlationId ?? job.id;

  logger.info(
    {
      jobId: job.id,
      correlationId,
      action,
      userId: meta?.userId,
      guildId: meta?.guildId,
      source: meta?.source,
    },
    `BackgroundWorker: Processing job action=${action}`,
  );

  logger.debug({ data }, 'BackgroundWorker: Job payload');

  return {
    success: true,
    action,
  };
}
