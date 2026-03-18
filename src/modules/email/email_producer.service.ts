import { Injectable } from '@nestjs/common';
import { EmailQueue } from 'src/libs/queue/queue.service';

@Injectable()
export class EmailProducerService {
  constructor(private emailQueue: EmailQueue) {}

  async sendApplicationEmail(
    user: {
      id: number;
      email: string;
      firstname?: string;
      lastname?: string;
    },
    applicationId?: number,
  ) {
    const displayName =
      [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email;

    await this.emailQueue.getEmailQueue().add(
      'send_email',
      {
        to: user.email,
        subject: 'Application Received',
        html: `<h1>Hello ${displayName}</h1><p>We received your application.</p>`,
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        jobId: applicationId ? `email-${user.id}-${applicationId}` : undefined,
      },
    );
  }
}
