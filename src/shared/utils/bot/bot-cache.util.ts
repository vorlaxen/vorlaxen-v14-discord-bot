import { redisService } from '@/infra/cache';
import { logger } from '@/infra/logger';

/**
 * Checks if a user is on cooldown for a specific command using Redis.
 * @returns {Promise<number>} Remaining TTL in seconds, or 0 if no cooldown.
 */
export async function checkCooldown(
  userId: string,
  commandName: string,
  cooldownSeconds: number,
): Promise<number> {
  const key = `cooldown:${commandName}:${userId}`;

  try {
    const redis = redisService.getClient();
    const ttl = await redis.ttl(key);

    if (ttl > 0) {
      return ttl;
    }

    await redisService.set(key, 'active', cooldownSeconds);

    return 0;
  } catch (error) {
    logger.error(
      { err: error },
      `[Redis] Cooldown check failed for user ${userId}`,
    );
    return 0;
  }
}
