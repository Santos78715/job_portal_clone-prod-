import { Module } from '@nestjs/common';
import { EmailModule } from 'src/modules/email/email.module';
import { EmailWorker } from './queue.worker';
import { WinstonLoggerService } from 'src/utils/winston/winston-logger.service';
import { WinstonModule } from 'src/utils/winston/winston.module';

@Module({
  imports: [EmailModule, WinstonModule],
  controllers: [],
  providers: [EmailWorker],
})
export class WorkerModule {}
