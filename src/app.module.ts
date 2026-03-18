import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { JobModule } from './modules/job/job.module';
import { CompanyModule } from './modules/company/company.module';
import { RedisClientModule } from './common/redis/client/redis_client.module';
import { JobApplicationModule } from './modules/job_application/job_application.module';
import { UploadModule } from './common/upload/upload.module';
import { WorkerModule } from './common/worker/worker.module';

@Module({
  imports: [
    RedisClientModule,
    UserModule,
    JobModule,
    CompanyModule,
    JobApplicationModule,
    UploadModule,
    WorkerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
