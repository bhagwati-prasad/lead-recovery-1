import { Global, Module } from '@nestjs/common';
import { CorrelationIdService } from './correlation-id.service';
import { AppLoggerService } from './app-logger.service';

@Global()
@Module({
  providers: [CorrelationIdService, AppLoggerService],
  exports: [CorrelationIdService, AppLoggerService],
})
export class LoggerModule {}