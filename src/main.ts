import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { HttpExceptionFilter } from './common/exception/exception.global';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { WinstonLoggerService } from './utils/winston/winston-logger.service';
import './instrument';

dotenv.config();

async function bootstrap() {
  const logger = new WinstonLoggerService();
  const app = await NestFactory.create(AppModule, { logger });
  app.useLogger(logger);
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
