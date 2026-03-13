import { Module } from '@nestjs/common';
import { IntegrationAdaptersModule } from '../../adapters/integration-adapters.module';
import { IntentClassifierService } from '../../services/intent-classifier.service';
import { ResponseProcessingService } from './response-processing.service';

@Module({
  imports: [IntegrationAdaptersModule],
  providers: [ResponseProcessingService, IntentClassifierService],
  exports: [ResponseProcessingService],
})
export class ResponseProcessingModule {}
