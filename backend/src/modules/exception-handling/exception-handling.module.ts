import { Module } from '@nestjs/common';
import { CRMAdapterModule } from '../../adapters/crm/crm-adapter.module';
import { EscalationModule } from '../escalation/escalation.module';
import { ExceptionHandlingService } from './exception-handling.service';

@Module({
  imports: [CRMAdapterModule, EscalationModule],
  providers: [ExceptionHandlingService],
  exports: [ExceptionHandlingService],
})
export class ExceptionHandlingModule {}