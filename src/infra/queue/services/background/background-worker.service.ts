import { Worker } from 'bullmq';
import { bullMQManager } from '@/infra/cache/adapters/bullmq.adapter';
import { BullMQConfig } from '@/config';
import { logger } from '@/infra/logger';
import { processBackgroundJob } from './background-processor.service';

export class BackgroundWorkerService {
  private static instance: BackgroundWorkerService;
  private worker: Worker | null = null;

  private constructor() {}

  public static getInstance(): BackgroundWorkerService {
    if (!BackgroundWorkerService.instance) {
      BackgroundWorkerService.instance = new BackgroundWorkerService();
    }
    return BackgroundWorkerService.instance;
  }

  public start(): Worker {
    if (this.worker) {
      logger.warn('BackgroundWorkerService: Consumer already running.');
      return this.worker;
    }

    const { queueName, concurrency, limiter } = BullMQConfig.background;

    logger.info(
      `BackgroundWorkerService: Starting consumer on [${queueName}] concurrency=${concurrency} rate=${limiter.max}/${limiter.duration}ms`,
    );

    this.worker = bullMQManager.createWorker(
      queueName,
      processBackgroundJob,
      {
        concurrency,
        limiter,
      },
    );

    return this.worker;
  }

  public isRunning(): boolean {
    return this.worker !== null && !this.worker.closing;
  }
}

export const backgroundWorkerService = BackgroundWorkerService.getInstance();
