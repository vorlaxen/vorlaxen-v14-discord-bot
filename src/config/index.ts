import { EnvUtils } from '@/shared/utils/common/env.util';
import { loadEnv } from '@/shared/utils/common/loader.util';
import { DefaultJobOptions } from 'bullmq';
import { RedisOptions } from 'ioredis';
import path from 'path';

loadEnv();

export const AppConfig = {
  isProd: process.env.NODE_ENV === 'production',
  appName: EnvUtils.string('APP_NAME', 'Vorlaxen Discord Bot'),
};

export const RuntimeConfig = {
  environment: EnvUtils.string('NODE_ENV', 'development'),
  isProd: AppConfig.isProd,
};

export const DatabaseConfig = {
  host: EnvUtils.string('DB_HOST'),
  port: EnvUtils.number('DB_PORT'),
  username: EnvUtils.string('DB_USERNAME'),
  password: EnvUtils.string('DB_PASSWORD'),
  database: EnvUtils.string('DB_NAME'),
  poolMax: EnvUtils.number('DB_POOL_MAX', 10),
  poolMin: EnvUtils.number('DB_POOL_MIN', 3),
  acquire: EnvUtils.number('DB_POOL_ACQUIRE', 30000),
  idle: EnvUtils.number('DB_POOL_IDLE', 10000),
  logging: EnvUtils.bool('DB_LOGGING', false),
  timezone: EnvUtils.string('DB_TIMEZONE', 'UTC'),
  entities: [path.join(__dirname, '../modules/**/*.entity.{ts,js}')],
  ssl: EnvUtils.bool('DB_SSL', false),
};

export const RedisConfig: RedisOptions = {
  host: EnvUtils.string('REDIS_HOST', '127.0.0.1'),
  port: EnvUtils.number('REDIS_PORT', 6379),
  username: EnvUtils.string('REDIS_USERNAME', ''),
  password: EnvUtils.string('REDIS_PASSWORD', ''),
  db: EnvUtils.number('REDIS_DB', 0),
  maxRetriesPerRequest: null,
  ...(EnvUtils.bool('REDIS_TLS_ENABLED', false)
    ? { tls: { rejectUnauthorized: false } }
    : {}),
  keyPrefix: EnvUtils.string('REDIS_PREFIX', 'vorlaxen-bot:'),
  connectTimeout: EnvUtils.number('REDIS_CONNECT_TIMEOUT', 10000),
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  offlineQueue: EnvUtils.bool('REDIS_OFFLINE_QUEUE', true),
};

export const BullMQConnectionConfig: RedisOptions = {
  host: RedisConfig.host,
  port: RedisConfig.port,
  username: RedisConfig.username,
  password: RedisConfig.password,
  db: RedisConfig.db,
  maxRetriesPerRequest: null,
  connectTimeout: RedisConfig.connectTimeout,
  retryStrategy: RedisConfig.retryStrategy,
  ...(EnvUtils.bool('REDIS_TLS_ENABLED', false)
    ? { tls: { rejectUnauthorized: false } }
    : {}),
};

export const BullMQConfig = {
  prefix: EnvUtils.string('BULLMQ_PREFIX', 'vorlaxen:queue'),
  jobOptions: {
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 3600,
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  } satisfies DefaultJobOptions,
  background: {
    queueName: EnvUtils.string('BACKGROUND_QUEUE_NAME', 'background'),
    concurrency: EnvUtils.number('BACKGROUND_WORKER_CONCURRENCY', 5),
    limiter: {
      max: EnvUtils.number('BACKGROUND_WORKER_RATE_MAX', 50),
      duration: EnvUtils.number('BACKGROUND_WORKER_RATE_DURATION_MS', 60_000),
    },
  },
};

export * from './bot.config';
