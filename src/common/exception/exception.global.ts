import * as common from '@nestjs/common';
import { Request, Response } from 'express';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@common.Catch(common.HttpException)
export class HttpExceptionFilter implements common.ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception: common.HttpException, host: common.ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      error: exception.message,
      path: request.url,
    });
  }
}
