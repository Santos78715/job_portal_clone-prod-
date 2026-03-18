import Redis from 'ioredis';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RedisClient {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisClient.name);

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD,
    });

    this.client.on('error', (err) => {
      this.logger.error(err?.message ?? String(err));
    });
  }

  getClient() {
    return this.client;
  }

  get(key: string) {
    return this.client.get(key);
  }

  set(key: string, value: string) {
    return this.client.set(key, value);
  }

  setEx(key: string, value: string, expireTimeInSeconds: number) {
    return this.client.set(key, value, 'EX', expireTimeInSeconds);
  }

  del(key: string) {
    return this.client.del(key);
  }

  incr(key: string) {
    return this.client.incr(key);
  }

  expire(key: string, seconds: number) {
    return this.client.expire(key, seconds);
  }
}
