import { Module } from '@nestjs/common';
import { EmailQueue } from 'src/libs/queue/queue.service';
import { EmailService } from 'src/modules/email/email.service';
import { EmailProducerService } from './email_producer.service';
import { WinstonLoggerService } from 'src/utils/winston/winston-logger.service';
@Module({
  imports: [],
  controllers: [],
  providers: [
    EmailQueue,
    EmailService,
    EmailProducerService,
    WinstonLoggerService,
  ],
  exports: [EmailQueue, EmailProducerService, EmailService],
})
export class EmailModule {}
