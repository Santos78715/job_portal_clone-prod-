import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RedisService } from 'src/common/redis/job/cache.service';
import { Token } from 'src/utils/token';
import { PasswordUtils } from 'src/utils/password';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, AuthGuard, RedisService, Token, PasswordUtils],
})
export class CompanyModule {}
