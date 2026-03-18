// email.queue.ts
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { connection } from './queue.connection';

@Injectable()
export class EmailQueue {
  private emailQueue: Queue;
  constructor() {
    this.emailQueue = new Queue('email-queue', {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    });
  }

  getEmailQueue() {
    return this.emailQueue;
  }
}
