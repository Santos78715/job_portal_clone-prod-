import { Module } from '@nestjs/common';
import { EmailModule } from 'src/modules/email/email.module';
import { EmailWorker } from './queue.worker';

@Module({
  imports: [EmailModule],
  controllers: [],
  providers: [EmailWorker],
})
export class WorkerModule {}
