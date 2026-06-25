import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../logger';
import { RedisConfig } from '@/config';

class RedisService {
  private static instance: RedisService;
  private client: Redis | null = null;
  private connectionPromise: Promise<Redis> | null = null;

  private constructor() {}

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<Redis> {
    if (this.client && this.client.status === 'ready') {
      return this.client;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        logger.info('Initializing Redis connection...');
        this.client = new Redis(RedisConfig as RedisOptions);

        this.setupEventListeners();
        await this.waitForReady();

        return this.client;
      } catch (err) {
        logger.error(`Redis: Failed to connect: ${(err as Error).message}`);
        this.connectionPromise = null;
        throw err;
      }
    })();

    return this.connectionPromise;
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('connect', () => logger.info('Redis: Connecting...'));
    this.client.on('ready', () =>
      logger.info('Redis: Connection established.'),
    );
    this.client.on('error', (err) =>
      logger.error(`Redis: Error - ${err.message}`),
    );
    this.client.on('reconnecting', () => logger.warn('Redis: Reconnecting...'));
    this.client.on('end', () => logger.info('Redis: Client disconnected.'));
  }

  private waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, RedisConfig.connectTimeout || 5000);

      this.client?.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client?.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  public async get<T>(key: string): Promise<T | null> {
    const data = await this.getClient().get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  public async set(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    const data =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (ttlSeconds) {
      await this.getClient().set(key, data, 'EX', ttlSeconds);
    } else {
      await this.getClient().set(key, data);
    }
  }

  public async del(key: string | string[]): Promise<void> {
    if (Array.isArray(key)) {
      await this.getClient().del(...key);
    } else {
      await this.getClient().del(key);
    }
  }

  public getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis: client not initialized. Call connect() first.');
    }
    return this.client;
  }

  public async disconnect(): Promise<void> {
    if (!this.client) return;

    try {
      logger.info('Redis: Shutting down client...');
      await this.client.quit();
      logger.info('Redis: client closed gracefully.');
    } catch (error) {
      logger.error(`Redis: Error during shutdown: ${(error as Error).message}`);
    } finally {
      this.client = null;
      this.connectionPromise = null;
    }
  }
}

export const redisService = RedisService.getInstance();
