import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { connection } from 'src/libs/queue/queue.connection';
import { EmailService } from 'src/modules/email/email.service';
import { WinstonLoggerService } from 'src/utils/winston/winston-logger.service'; // adjust path

type EmailJobData = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class EmailWorker implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<EmailJobData>;

  constructor(
    private emailService: EmailService,
    private readonly logger: WinstonLoggerService, // ✅ inject winston logger
  ) {}

  onModuleInit() {
    this.worker = new Worker<EmailJobData>(
      'email-queue',
      async (job: Job<EmailJobData>) => {
        const { to, subject } = job.data;

        this.logger.log(`Processing email job ${job.id}`, EmailWorker.name);

        await this.emailService.sendEmail(to, subject, job.data.html);

        this.logger.log(`Completed email job ${job.id}`, EmailWorker.name);
      },
      {
        connection,
        concurrency: 50,
        limiter: {
          max: 100,
          duration: 1000,
        },
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Email job failed id=${job?.id}: ${err?.message ?? String(err)}`,
        err?.stack,
        EmailWorker.name,
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
