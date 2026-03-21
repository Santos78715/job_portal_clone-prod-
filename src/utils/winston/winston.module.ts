import { Module } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service';

@Module({
  imports: [],
  exports: [WinstonLoggerService],
  controllers: [],
  providers: [WinstonLoggerService],
})
export class WinstonModule {}
