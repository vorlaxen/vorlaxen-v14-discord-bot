import { redisClientConfig } from "@/config";
import logger from "@/infrastructure/logger";
import Redis from "ioredis";

let redisClient: Redis | null = null;

export const initializeRedis = async (): Promise<Redis> => {
  if (redisClient) return redisClient;

  redisClient = new Redis(redisClientConfig);

  redisClient.on('connect', () => logger.info('Redis connecting...'));
  redisClient.on('ready', () => logger.info('Redis connection established'));
  redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));
  redisClient.on('close', () => logger.warn('Redis connection closed'));
  redisClient.on('end', () => logger.info('Redis client ended'));

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 3000);

      redisClient!.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      redisClient!.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } catch (err) {
    logger.error('Redis bağlantısı kurulamadı. Uygulama başlatılamıyor.');
    process.exit(1);
  }

  return redisClient;
};

export const getRedisClient = (): Redis => {
  if (!redisClient) throw new Error("Redis client not initialized. Call initializeRedis() first.");
  return redisClient;
};

export const redisSetWithTTL = async (redis: Redis, key: string, value: any, ttlSeconds: number) => {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds as any);
};

export const closeRedis = async (): Promise<void> => {
  if (!redisClient) return;

  logger.info('Shutting down Redis client...');
  try {
    await redisClient.quit();
    logger.info('Redis client shut down successfully.');
  } catch (error) {
    logger.error(`Error during Redis client shutdown: ${(error as Error).message}`);
  } finally {
    redisClient = null;
  }
};
