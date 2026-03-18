import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { FeatureExtractor } from '../../ml/feature-extractor';
import { GradientBoostedAssessmentModel } from '../../ml/gradient-boosted.model';
import { LogisticRegressionModel } from '../../ml/logistic-regression.model';
import { MlController } from '../../ml/ml.controller';
import { MlLifecycleService } from '../../ml/ml-lifecycle.service';
import { MockAssessmentModel } from '../../ml/mock-assessment.model';
import { ModelRegistry } from '../../ml/model-registry';
import { ModelVersionManager } from '../../ml/model-version-manager.service';
import { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service';
import { AccomplishmentAssessmentService } from './accomplishment-assessment.service';

@Module({
  imports: [AnalyticsModule],
  providers: [
    SentimentAnalyzerService,
    FeatureExtractor,
    GradientBoostedAssessmentModel,
    LogisticRegressionModel,
    MockAssessmentModel,
    ModelRegistry,
    ModelVersionManager,
    MlLifecycleService,
    AccomplishmentAssessmentService,
  ],
  controllers: [MlController],
  exports: [
    AccomplishmentAssessmentService,
    ModelRegistry,
    FeatureExtractor,
    SentimentAnalyzerService,
    MlLifecycleService,
  ],
})
export class AccomplishmentAssessmentModule {}