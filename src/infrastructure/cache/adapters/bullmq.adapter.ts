import { Queue, Worker, Job } from 'bullmq'
import { initializeRedis } from '..'
import logger from '../../logger'

type JobProcessor<T = unknown, R = unknown> = (job: Job<T>) => Promise<R>

class BullAdapter {
  private queues = new Map<string, Queue>()
  private workers = new Map<string, Worker>()
  private redisPromise = initializeRedis()

  private async getRedis() {
    return this.redisPromise
  }

  async createQueue(name: string) {
    if (this.queues.has(name)) {
      return this.queues.get(name)!
    }

    const redis = await this.getRedis()
    const queue = new Queue(name, { connection: redis })

    this.queues.set(name, queue)
    return queue
  }

  async createWorker<T, R>(
    name: string,
    processor: JobProcessor<T, R>
  ) {
    if (this.workers.has(name)) {
      throw new Error(`Worker "${name}" already exists`)
    }

    const redis = await this.getRedis()
    const worker = new Worker<T, R>(name, processor, {
      connection: redis,
    })

    worker.on('completed', job =>
      logger.info(`[Bull] ${name} job ${job.id} completed`)
    )

    worker.on('failed', (job, err) =>
      logger.error(`[Bull] ${name} job ${job?.id} failed: ${err.message}`)
    )

    this.workers.set(name, worker)
    return worker
  }

  async shutdown() {
    await Promise.all([
      ...Array.from(this.workers.values()).map(w => w.close()),
      ...Array.from(this.queues.values()).map(q => q.close()),
    ])
  }
}

export const bullAdapter = new BullAdapter()