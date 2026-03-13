import { Module } from '@nestjs/common';
import { IntegrationAdaptersModule } from '../../adapters/integration-adapters.module';
import { CallInitiationService } from './call-initiation.service';

@Module({
  imports: [IntegrationAdaptersModule],
  providers: [CallInitiationService],
  exports: [CallInitiationService],
})
export class CallInitiationModule {}
