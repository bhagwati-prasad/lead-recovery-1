import { Injectable } from '@nestjs/common';
import { FeatureVector } from '../modules/phase4.types';
import { MLAssessmentModel } from './ml-assessment-model.interface';

@Injectable()
export class GradientBoostedAssessmentModel implements MLAssessmentModel {
  readonly version = 'v2-gboost';

  async predict(features: FeatureVector): Promise<number> {
    // Lightweight approximation that introduces non-linearity compared with logistic regression.
    const score = 0.35
      + (features.goalAchievementRate * 0.4)
      + (features.resolvedObjectionRate * 0.2)
      + (Math.max(-1, Math.min(1, features.sentimentTrajectory)) * 0.15)
      - (Math.min(10, features.objectionCount) * 0.02)
      - (features.hardRejectionEncountered * 0.25)
      - (features.escalationTriggered * 0.2)
      - (Math.min(20, features.previousCallAttempts) * 0.01);

    return Math.max(0, Math.min(1, Number(score.toFixed(4))));
  }
}
