import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

export type CacheKeyBuilder = (req: any) => string;

export const Cacheable = (keyBuilder: CacheKeyBuilder, ttl = 60) => {
  return SetMetadata(CACHE_KEY, { keyBuilder, ttl });
};
