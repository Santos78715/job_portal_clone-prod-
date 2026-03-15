import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redisClient: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD,
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(err?.message ?? String(err));
    });
  }

  async set(
    key: string,
    value: string,
    expireTimeInSeconds?: number,
  ): Promise<void> {
    if (expireTimeInSeconds) {
      await this.redisClient.set(key, value, 'EX', expireTimeInSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
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

  async expire(key: string, seconds: number): Promise<void> {
    await this.redisClient.expire(key, seconds);
  }
}
