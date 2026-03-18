// cache.interceptor.ts
import { Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from './cache.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { CACHE_KEY } from './cache.decorator';
import { of, tap } from 'rxjs';

type CacheMeta = {
  keyBuilder: (req: unknown) => string;
  ttl: number;
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private cacheService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const meta = this.reflector.get<CacheMeta>(CACHE_KEY, context.getHandler());

    if (!meta) return next.handle();

    const request = context.switchToHttp().getRequest<unknown>();

    const cacheKey = meta.keyBuilder(request);
    const ttl = meta.ttl ?? 60;

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      try {
        return of(JSON.parse(cached));
      } catch {
        return of(cached);
      }
    }

    return next.handle().pipe(
      tap((response) => {
        void this.cacheService.set(cacheKey, JSON.stringify(response), ttl);
      }),
    );
  }
}
