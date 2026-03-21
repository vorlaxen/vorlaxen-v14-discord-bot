import { EnvUtils } from "@/shared/utils/common/env.util";
import { RedisOptions } from "ioredis";

const env = process.env;

export interface IRedisClientConfig extends RedisOptions {
    host: string;
    user?: string;
    port: number;
    prefix: string;
    password: string | undefined;
}

const REDIS_RETRY_MAX = EnvUtils.mustParse(env.REDIS_RETRY_MAX || '10', 'REDIS_RETRY_MAX', Number);

const customRetryStrategy = (times: number): number | null => {
    if (times > REDIS_RETRY_MAX) {
        return null;
    }

    const delay = Math.min(times * 50, 2000);
    return delay;
};

export const redisClientConfig: IRedisClientConfig = {
    host: EnvUtils.mustParse(env.REDIS_HOST, 'REDIS_HOST', String),
    port: EnvUtils.mustParse(env.REDIS_PORT, 'REDIS_PORT', Number),
    user: env.REDIS_USERNAME || undefined,
    password: env.REDIS_PASSWORD || undefined,
    db: EnvUtils.mustParse(env.REDIS_DB || '0', 'REDIS_DB', Number),
    prefix: "vorlaxen-discord-bot:",
    tls: env.REDIS_TLS_ENABLED === 'true' ? { rejectUnauthorized: false } : undefined,
    connectTimeout: EnvUtils.mustParse(env.REDIS_CONNECT_TIMEOUT || '10000', 'REDIS_CONNECT_TIMEOUT', Number),
    maxRetriesPerRequest: null,
    enableOfflineQueue: env.REDIS_OFFLINE_QUEUE !== 'false',
    retryStrategy: customRetryStrategy,
};