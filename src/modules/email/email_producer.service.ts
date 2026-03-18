import { Injectable } from '@nestjs/common';
import { EmailQueue } from 'src/libs/queue/queue.service';

@Injectable()
export class EmailProducerService {
  constructor(private emailQueue: EmailQueue) {}

  async sendApplicationEmail(user: any) {
    await this.emailQueue.getEmailQueue().add(
      'send_email',
      {
        to: user.email,
        subject: 'Application Received',
        html: `<h1>Hello ${user.name}</h1>`,
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        jobId: `email-${user.id}`,
      },
    );
  }
}
