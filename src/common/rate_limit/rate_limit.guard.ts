import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../redis/job/cache.service';
import type { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip =
      request.ip ??
      request.socket?.remoteAddress ??
      request.connection?.remoteAddress ??
      'unknown';

    const limit = 5;
    const windowMs = 60 * 1000;

    const count = await this.redisService.increment(ip, windowMs);
    if (count > limit) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
