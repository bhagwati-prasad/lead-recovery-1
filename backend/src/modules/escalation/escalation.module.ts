import { Module } from '@nestjs/common';
import { CRMAdapterModule } from '../../adapters/crm/crm-adapter.module';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { EscalationService } from '../../services/escalation.service';
import { EscalationController } from './escalation.controller';

@Module({
  imports: [CRMAdapterModule, AnalyticsModule],
  providers: [EscalationService],
  controllers: [EscalationController],
  exports: [EscalationService],
})
export class EscalationModule {}