import { Module } from '@nestjs/common';
import { JobApplicationService } from './job_application.service';
import { JobApplicationController } from './job_application.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { Token } from 'src/utils/token';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { RedisService } from 'src/common/redis/job/cache.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [JobApplicationController],
  providers: [
    JobApplicationService,
    Token,
    AuthGuard,
    RoleGuard,
    RedisService,
  ],
})
export class JobApplicationModule {}
