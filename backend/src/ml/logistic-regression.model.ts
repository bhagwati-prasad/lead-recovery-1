import { Injectable } from '@nestjs/common';
import { FeatureVector } from '../modules/phase4.types';
import { MLAssessmentModel } from './ml-assessment-model.interface';

@Injectable()
export class LogisticRegressionModel implements MLAssessmentModel {
  readonly version = 'v1-logistic';

  private readonly weights: Record<keyof FeatureVector, number> = {
    goalAchievementRate: 2.4,
    totalTurns: -0.1,
    turnsToFirstGoal: -0.25,
    objectionCount: -0.2,
    resolvedObjectionRate: 1.1,
    hardRejectionEncountered: -1.8,
    escalationTriggered: -1.5,
    sentimentTrajectory: 0.9,
    callDurationSeconds: -0.001,
    avgAgentResponseMs: -0.0004,
    stageDropDepth: -0.2,
    previousCallAttempts: -0.15,
  };

  private readonly bias = -0.3;

  async predict(features: FeatureVector): Promise<number> {
    const linear = (Object.keys(this.weights) as Array<keyof FeatureVector>)
      .reduce((sum, key) => sum + this.weights[key] * features[key], this.bias);
    return 1 / (1 + Math.exp(-linear));
  }
}