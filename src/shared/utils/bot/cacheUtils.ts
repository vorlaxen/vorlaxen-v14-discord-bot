import { getRedisClient, redisSetWithTTL } from '@/infrastructure/cache';
import logger from '@/infrastructure/logger';

const redis = getRedisClient();

/**
 * Checks if a user is on cooldown for a specific command using Redis.
 * @returns {Promise<number>} Remaining TTL in seconds, or 0 if no cooldown.
 */
export async function checkCooldown(
  userId: string,
  commandName: string,
  cooldownSeconds: number
): Promise<number> {
  const key = `cooldown:${commandName}:${userId}`;

  try {
    const ttl = await redis.ttl(key);

    if (ttl > 0) {
      return ttl;
    }
    
    await redisSetWithTTL(redis, key, 'active', cooldownSeconds);

    return 0;
  } catch (error) {
    logger.error(`[Redis] Cooldown check failed for user ${userId}:`, error);
    return 0;
  }
}
