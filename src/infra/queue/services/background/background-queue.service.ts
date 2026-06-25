import { Job, JobsOptions } from 'bullmq';
import { bullMQManager } from '@/infra/cache/adapters/bullmq.adapter';
import { BullMQConfig } from '@/config';
import { logger } from '@/infra/logger';
import { BackgroundJobNames } from '../../constants/job-names.constant';
import { BackgroundJobPayload } from '../../types/background-job.type';

export class BackgroundQueueService {
  private static instance: BackgroundQueueService;
  private readonly queueName = BullMQConfig.background.queueName;

  private constructor() {}

  public static getInstance(): BackgroundQueueService {
    if (!BackgroundQueueService.instance) {
      BackgroundQueueService.instance = new BackgroundQueueService();
    }
    return BackgroundQueueService.instance;
  }

  public async enqueue(
    payload: BackgroundJobPayload,
    opts?: JobsOptions,
  ): Promise<Job<BackgroundJobPayload>> {
    logger.info(
      `BackgroundQueue: Enqueueing job action=${payload.action} (queue: ${this.queueName})`,
    );

    return bullMQManager.addJob<BackgroundJobPayload>(
      this.queueName,
      BackgroundJobNames.EXECUTE,
      payload,
      opts,
    );
  }

  public async enqueueAction(
    action: string,
    data?: BackgroundJobPayload['data'],
    meta?: BackgroundJobPayload['meta'],
    opts?: JobsOptions,
  ): Promise<Job<BackgroundJobPayload>> {
    return this.enqueue({ action, data, meta }, opts);
  }
}

export const backgroundQueueService = BackgroundQueueService.getInstance();
