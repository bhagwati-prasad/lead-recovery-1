import { Injectable } from '@nestjs/common';
import { FeatureExtractor } from '../../ml/feature-extractor';
import { ModelRegistry } from '../../ml/model-registry';
import { WorkflowModuleError } from '../../common/errors/workflow-module.error';
import { ExecutionContext } from '../../common/interfaces/execution-context.interface';
import { ModuleInput, ModuleOutput, ValidationError } from '../../common/interfaces/module.types';
import { WorkflowModule } from '../../common/interfaces/workflow-module.interface';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { TranscriptEntry } from '../../common/models/call-session.model';
import { ConversationStrategy } from '../phase2.types';
import { AccomplishmentAssessmentResult } from '../phase4.types';

export interface AccomplishmentAssessmentInput extends ModuleInput {
  transcript: TranscriptEntry[];
  conversationStrategy: ConversationStrategy;
  endReason: string;
  objectionsDetected: number;
  objectionResolvedHints: number;
  callDurationSeconds?: number;
  avgAgentResponseMs?: number;
  stageDropDepth?: number;
  previousCallAttempts?: number;
}

export interface AccomplishmentAssessmentOutput extends ModuleOutput {
  assessment: AccomplishmentAssessmentResult;
}

@Injectable()
export class AccomplishmentAssessmentService
  implements WorkflowModule<AccomplishmentAssessmentInput, AccomplishmentAssessmentOutput>
{
  readonly id = 'accomplishment-assessment';
  private readonly logger: ReturnType<AppLoggerService['createLogger']>;

  constructor(
    private readonly featureExtractor: FeatureExtractor,
    private readonly modelRegistry: ModelRegistry,
    private readonly loggerFactory: AppLoggerService,
  ) {
    this.logger = this.loggerFactory.createLogger(this.id);
  }

  async execute(input: AccomplishmentAssessmentInput, _context: ExecutionContext): Promise<AccomplishmentAssessmentOutput> {
    const validationErrors = this.validateInputs(input);
    if (validationErrors.length > 0) {
      throw new WorkflowModuleError(validationErrors[0].message, this.id);
    }

    const features = this.featureExtractor.extract(input);
    const model = this.modelRegistry.getActive();
    const conversionProbability = Number((await model.predict(features)).toFixed(4));
    const recommendation = this.recommend(conversionProbability, input.endReason);

    const assessment: AccomplishmentAssessmentResult = {
      conversionProbability,
      goalAchievementRate: features.goalAchievementRate,
      momentumScore: Math.max(0, Math.min(1, 1 - (features.turnsToFirstGoal / Math.max(1, features.totalTurns)))),
      rejectionConfidence: features.hardRejectionEncountered > 0 ? 0.95 : Math.max(0, 1 - conversionProbability),
      objectionsResolved: input.objectionResolvedHints,
      objectionsUnresolved: Math.max(0, input.objectionsDetected - input.objectionResolvedHints),
      recommendation,
      modelVersion: model.version,
      factors: [
        { name: 'goalAchievementRate', value: features.goalAchievementRate, weight: 0.3 },
        { name: 'resolvedObjectionRate', value: features.resolvedObjectionRate, weight: 0.2 },
        { name: 'sentimentTrajectory', value: features.sentimentTrajectory, weight: 0.2 },
        { name: 'hardRejection', value: features.hardRejectionEncountered, weight: 0.3 },
      ],
    };

    this.logger.info('Accomplishment assessment generated', {
      modelVersion: assessment.modelVersion,
      conversionProbability: assessment.conversionProbability,
      recommendation: assessment.recommendation,
    });

    return { assessment };
  }

  validateInputs(input: AccomplishmentAssessmentInput): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!Array.isArray(input.transcript)) {
      errors.push({ field: 'transcript', message: 'transcript must be an array' });
    }
    if (!input.conversationStrategy || typeof input.conversationStrategy.maxTurns !== 'number') {
      errors.push({ field: 'conversationStrategy', message: 'conversationStrategy is required' });
    }
    if (typeof input.endReason !== 'string' || input.endReason.trim().length === 0) {
      errors.push({ field: 'endReason', message: 'endReason is required' });
    }
    if (typeof input.objectionsDetected !== 'number') {
      errors.push({ field: 'objectionsDetected', message: 'objectionsDetected is required' });
    }
    if (typeof input.objectionResolvedHints !== 'number') {
      errors.push({ field: 'objectionResolvedHints', message: 'objectionResolvedHints is required' });
    }
    return errors;
  }

  getDependencies(): string[] {
    return ['conversation-loop'];
  }

  isFusable(_adjacentModuleId: string): boolean {
    return false;
  }

  canSkip(_context: ExecutionContext): boolean {
    return false;
  }

  private recommend(probability: number, endReason: string): AccomplishmentAssessmentResult['recommendation'] {
    if (endReason === 'customer-declined') {
      return probability >= 0.4 ? 'escalate-cold' : 'close-failed';
    }
    if (probability >= 0.75) {
      return 'close-recovered';
    }
    if (probability >= 0.5) {
      return 'schedule-follow-up';
    }
    if (probability >= 0.35) {
      return 'escalate-warm';
    }
    return 'escalate-cold';
  }
}