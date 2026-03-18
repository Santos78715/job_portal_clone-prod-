import { Module } from '@nestjs/common';
import { EmailQueue } from 'src/libs/queue/queue.service';
import { EmailService } from './email.service';
import { EmailProducerService } from './email_producer.service';
@Module({
  imports: [],
  controllers: [],
  providers: [EmailQueue, EmailService, EmailProducerService],
  exports: [EmailQueue, EmailProducerService, EmailService],
})
export class EmailModule {}
