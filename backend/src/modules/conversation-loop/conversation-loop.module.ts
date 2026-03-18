import { Module } from '@nestjs/common';
import { AssessmentService } from '../../services/assessment.service';
import { ResponseProcessingModule } from '../response-processing/response-processing.module';
import { ConversationLoopService } from './conversation-loop.service';

@Module({
  imports: [ResponseProcessingModule],
  providers: [ConversationLoopService, AssessmentService],
  exports: [ConversationLoopService],
})
export class ConversationLoopModule {}
