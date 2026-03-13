import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { ObjectionsModule } from '../objections/objections.module';
import { ConversationLoggingService } from './conversation-logging.service';

@Module({
  imports: [AnalyticsModule, ObjectionsModule],
  providers: [ConversationLoggingService],
  exports: [ConversationLoggingService],
})
export class ConversationLoggingModule {}