import { Module } from '@nestjs/common';
import { CRMAdapterModule } from '../adapters/crm/crm-adapter.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LeadsController } from './leads.controller';
import { PreCallFeatureExtractorService } from './pre-call-feature-extractor.service';
import { PreCallScoringModel } from './pre-call-scoring.model';
import { PreCallScoringService } from './pre-call-scoring.service';

@Module({
  imports: [CRMAdapterModule, AnalyticsModule],
  controllers: [LeadsController],
  providers: [PreCallFeatureExtractorService, PreCallScoringModel, PreCallScoringService],
  exports: [PreCallScoringService],
})
export class LeadsModule {}
