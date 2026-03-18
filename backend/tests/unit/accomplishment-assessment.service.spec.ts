import { AppConfigService } from 'src/common/config/app-config.service';
import { AppLoggerService } from 'src/common/logger/app-logger.service';
import { CorrelationIdService } from 'src/common/logger/correlation-id.service';
import { FeatureExtractor } from 'src/ml/feature-extractor';
import { GradientBoostedAssessmentModel } from 'src/ml/gradient-boosted.model';
import { LogisticRegressionModel } from 'src/ml/logistic-regression.model';
import { MockAssessmentModel } from 'src/ml/mock-assessment.model';
import { ModelRegistry } from 'src/ml/model-registry';
import { AccomplishmentAssessmentService } from 'src/modules/accomplishment-assessment/accomplishment-assessment.service';
import { SentimentAnalyzerService } from 'src/services/sentiment-analyzer.service';
import { buildExecutionContext, testConfig } from './test-helpers';

describe('AccomplishmentAssessmentService', () => {
  const configService = { getConfig: () => testConfig } as AppConfigService;
  const loggerFactory = new AppLoggerService(configService, new CorrelationIdService());

  it('returns a bounded conversion probability with recommendation', async () => {
    const modelRegistry = new ModelRegistry(
      new GradientBoostedAssessmentModel(),
      new LogisticRegressionModel(),
      new MockAssessmentModel(),
    );
    const service = new AccomplishmentAssessmentService(
      new FeatureExtractor(new SentimentAnalyzerService()),
      modelRegistry,
      loggerFactory,
    );

    const output = await service.execute(
      {
        transcript: [
          { timestamp: new Date('2026-03-13T10:00:00Z'), speaker: 'agent', text: 'Hi there' },
          { timestamp: new Date('2026-03-13T10:00:02Z'), speaker: 'customer', text: 'yes continue' },
          { timestamp: new Date('2026-03-13T10:00:03Z'), speaker: 'agent', text: 'Great, let us proceed' },
        ],
        conversationStrategy: {
          systemPrompt: 'Help customer complete application',
          anticipatedObjections: [],
          resolutionScripts: [],
          agentPersona: {
            name: 'Asha',
            language: 'en-IN',
            tone: 'empathetic',
            voiceId: 'mock-voice-1',
          },
          maxTurns: 5,
          goals: [
            {
              id: 'confirm-interest',
              description: 'Confirm willingness',
              completionSignal: 'customer agrees',
              isMandatory: true,
            },
          ],
        },
        endReason: 'goal-achieved',
        objectionsDetected: 1,
        objectionResolvedHints: 1,
      },
      buildExecutionContext(),
    );

    expect(output.assessment.conversionProbability).toBeGreaterThanOrEqual(0);
    expect(output.assessment.conversionProbability).toBeLessThanOrEqual(1);
    expect(output.assessment.recommendation).toBe('close-recovered');
    expect(output.assessment.modelVersion).toBeDefined();
  });
});
