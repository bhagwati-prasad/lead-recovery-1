import { Injectable } from '@nestjs/common';
import { FeatureVector } from '../modules/phase4.types';
import { MLAssessmentModel } from './ml-assessment-model.interface';

@Injectable()
export class MockAssessmentModel implements MLAssessmentModel {
  readonly version = 'v1-mock';

  async predict(features: FeatureVector): Promise<number> {
    if (features.goalAchievementRate >= 1 && features.hardRejectionEncountered === 0) {
      return 0.8;
    }

    if (features.hardRejectionEncountered > 0 || features.escalationTriggered > 0) {
      return 0.2;
    }

    return 0.5;
  }
}