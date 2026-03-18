import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisService } from 'src/common/redis/job/cache.service';
import { Token } from 'src/utils/token';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CacheKeys } from 'src/common/redis/job/cache_keys.redis';

@Module({
  imports: [PrismaModule],
  controllers: [JobController],
  providers: [JobService, RedisService, Token, AuthGuard, RoleGuard, CacheKeys],
})
export class JobModule {}
