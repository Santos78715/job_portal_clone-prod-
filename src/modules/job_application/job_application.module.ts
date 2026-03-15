import { Module } from '@nestjs/common';
import { JobApplicationService } from './job_application.service';
import { JobApplicationController } from './job_application.controller';

@Module({
  controllers: [JobApplicationController],
  providers: [JobApplicationService],
})
export class JobApplicationModule {}
