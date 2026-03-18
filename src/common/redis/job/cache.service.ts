import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { RedisClient } from '../client/client.redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  constructor(private redisClient: RedisClient) {}

  async set(
    key: string,
    value: string,
    expireTimeInSeconds?: number,
  ): Promise<void> {
    try {
      if (expireTimeInSeconds) {
        await this.redisClient.setEx(key, value, expireTimeInSeconds);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (err) {
      this.logger.error(
        `Redis SET failed for key=${key}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (err) {
      this.logger.error(
        `Redis GET failed for key=${key}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (err) {
      this.logger.error(
        `Redis DEL failed for key=${key}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  refreshKey(userId: number, jti: string) {
    return `refresh:${userId}:${jti}`;
  }

  async increment(key: string, windowMs: number): Promise<number> {
    const count = await this.redisClient.incr(key);
    if (count == 1) {
      await this.redisClient.expire(key, windowMs / 1000);
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.redisClient.incr(key);
    } catch (err) {
      this.logger.error(
        `Redis INCR failed for key=${key}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redisClient.expire(key, seconds);
  }
}
