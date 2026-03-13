import { Module } from '@nestjs/common';
import { FeatureExtractor } from '../../ml/feature-extractor';
import { LogisticRegressionModel } from '../../ml/logistic-regression.model';
import { MockAssessmentModel } from '../../ml/mock-assessment.model';
import { ModelRegistry } from '../../ml/model-registry';
import { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service';
import { AccomplishmentAssessmentService } from './accomplishment-assessment.service';

@Module({
  providers: [
    SentimentAnalyzerService,
    FeatureExtractor,
    LogisticRegressionModel,
    MockAssessmentModel,
    ModelRegistry,
    AccomplishmentAssessmentService,
  ],
  exports: [AccomplishmentAssessmentService, ModelRegistry, FeatureExtractor, SentimentAnalyzerService],
})
export class AccomplishmentAssessmentModule {}