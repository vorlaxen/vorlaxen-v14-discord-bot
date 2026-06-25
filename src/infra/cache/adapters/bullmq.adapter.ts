import {
  Queue,
  Worker,
  Processor,
  QueueOptions,
  WorkerOptions,
  JobsOptions,
  Job,
} from 'bullmq';
import { logger } from '@/infra/logger';
import { BullMQConfig, BullMQConnectionConfig } from '@/config';

export class BullMQManager {
  private static instance: BullMQManager;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  private constructor() {}

  public static getInstance(): BullMQManager {
    if (!BullMQManager.instance) {
      BullMQManager.instance = new BullMQManager();
    }
    return BullMQManager.instance;
  }

  private get connectionConfig() {
    return { ...BullMQConnectionConfig };
  }

  private get defaultQueueOptions(): Partial<QueueOptions> {
    return {
      connection: this.connectionConfig,
      prefix: BullMQConfig.prefix,
      defaultJobOptions: BullMQConfig.jobOptions,
    };
  }

  public getQueue<DataType = unknown, ResultType = unknown>(
    name: string,
    opts?: Partial<QueueOptions>,
  ): Queue<DataType, ResultType> {
    if (this.queues.has(name)) {
      return this.queues.get(name) as Queue<DataType, ResultType>;
    }

    const queue = new Queue<DataType, ResultType>(name, {
      ...this.defaultQueueOptions,
      ...opts,
      connection: this.connectionConfig,
    });

    this.queues.set(name, queue);
    return queue;
  }

  public async addJob<T = unknown>(
    queueName: string,
    jobName: string,
    data: T,
    opts?: JobsOptions,
  ): Promise<Job<T>> {
    const queue = this.getQueue<T>(queueName);
    try {
      const job = await queue.add(jobName as never, data as never, opts);
      logger.debug(
        `BullMQ: Job enqueued [${queueName}/${jobName}] id=${job.id}`,
      );
      return job as Job<T>;
    } catch (error) {
      logger.error(
        `BullMQ: Enqueue failed [${queueName}/${jobName}]: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  public createWorker<T = unknown, R = unknown>(
    queueName: string,
    processor: Processor<T, R>,
    opts?: Omit<WorkerOptions, 'connection' | 'prefix'>,
  ): Worker<T, R> {
    if (this.workers.has(queueName)) {
      logger.warn(`BullMQ: Worker already active for [${queueName}]`);
      return this.workers.get(queueName) as Worker<T, R>;
    }

    const worker = new Worker<T, R>(queueName, processor, {
      connection: this.connectionConfig,
      prefix: BullMQConfig.prefix,
      ...opts,
    });

    worker.on('active', (job) => {
      logger.info(
        `BullMQ: Job active [${queueName}] id=${job.id} name=${job.name}`,
      );
    });

    worker.on('completed', (job, result) => {
      logger.info(
        `BullMQ: Job completed [${queueName}] id=${job.id} name=${job.name}`,
      );
      logger.debug({ result }, 'BullMQ: Job result payload');
    });

    worker.on('failed', (job, err) => {
      logger.error(
        `BullMQ: Job failed [${queueName}] id=${job?.id} name=${job?.name}: ${err.message}`,
      );
    });

    worker.on('error', (err) => {
      logger.error(`BullMQ: Worker error [${queueName}]: ${err.message}`);
    });

    this.workers.set(queueName, worker);
    logger.info(`BullMQ: Worker listening on [${queueName}]`);
    return worker;
  }

  public hasWorker(queueName: string): boolean {
    return this.workers.has(queueName);
  }

  public async shutdown(): Promise<void> {
    logger.info('BullMQ: Graceful shutdown initiated...');

    const shutdownTasks = [
      ...Array.from(this.workers.values()).map((worker) => worker.close()),
      ...Array.from(this.queues.values()).map((queue) => queue.close()),
    ];

    await Promise.allSettled(shutdownTasks);

    this.workers.clear();
    this.queues.clear();

    logger.info('BullMQ: All queues and workers closed.');
  }
}

export const bullMQManager = BullMQManager.getInstance();
