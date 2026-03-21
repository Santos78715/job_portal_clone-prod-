import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import WinstonCloudwatch from 'winston-cloudwatch';

const { combine, timestamp, json, errors } = winston.format;

const serviceName = process.env.SERVICE_NAME ?? 'job-portal-api';
const logLevel = process.env.LOG_LEVEL ?? 'info';
const awsRegion = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;

const transports: winston.transport[] = [
  new winston.transports.Console({
    handleExceptions: true,
    handleRejections: true,
  }),
];

const logger = winston.createLogger({
  level: logLevel,
  format: combine(errors({ stack: true }), timestamp(), json()),
  defaultMeta: { service: serviceName },
  transports,
});

try {
  const awsAccessKeyId =
    process.env.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY;
  const awsSecretKey =
    process.env.AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_KEY;

  const cloudwatchTransport = new WinstonCloudwatch({
    level: logLevel,
    ensureLogGroup: true,
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP ?? 'my-app-logs',
    logStreamName:
      process.env.CLOUDWATCH_LOG_STREAM ??
      `${serviceName}-${new Date().toISOString().split('T')[0]}-${process.pid}`,
    awsRegion,
    ...(awsAccessKeyId && awsSecretKey ? { awsAccessKeyId, awsSecretKey } : {}),
    jsonMessage: true,
    errorHandler: (err) => {
      // Avoid recursion by not logging through winston here.
      // eslint-disable-next-line no-console
      console.error('CloudWatch transport error:', err);
    },
  });

  const flushCloudwatch = () => {
    try {
      cloudwatchTransport.kthxbye(() => undefined);
    } catch {
      // ignore
    }
  };

  process.once('beforeExit', flushCloudwatch);
  process.once('SIGTERM', flushCloudwatch);
  process.once('SIGINT', flushCloudwatch);

  logger.add(cloudwatchTransport);
} catch {
  // Best-effort: if CloudWatch transport fails, console/file logs still work.
}

export default logger;
