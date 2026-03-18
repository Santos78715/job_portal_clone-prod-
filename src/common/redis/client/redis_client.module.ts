import { Global, Module } from '@nestjs/common';
import { RedisClient } from './client.redis';

@Global()
@Module({
  providers: [RedisClient],
  exports: [RedisClient],
})
export class RedisClientModule {}

