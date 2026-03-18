import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { connection } from 'src/libs/queue/queue.connection';
import { EmailService } from 'src/modules/email/email.service';

type EmailJobData = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class EmailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailWorker.name);
  private worker?: Worker<EmailJobData>;

  constructor(private emailService: EmailService) {}

  onModuleInit() {
    this.worker = new Worker<EmailJobData>(
      'email-queue',
      async (job: Job<EmailJobData>) => {
        const { to, subject, html } = job.data;
        this.logger.log(`Processing email job ${job.id}`);
        await this.emailService.sendEmail(to, subject, html);
        this.logger.log(`Completed email job ${job.id}`);
      },
      {
        connection,
        concurrency: 50,
        limiter: {
          max: 100, // 100 emails/sec
          duration: 1000,
        },
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Email job failed id=${job?.id}: ${err?.message ?? String(err)}`,
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
