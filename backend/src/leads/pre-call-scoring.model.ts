import { Injectable } from '@nestjs/common';

export interface PreCallFeatureVector {
  funnelStageDropDepth: number;
  dropOffReasonScore: number;
  daysSinceDropOff: number;
  previousCallAttempts: number;
  languageRiskScore: number;
  stageObjectionCount: number;
  historicalStageRecoveryRate: number;
  hourOfDay: number;
  dayOfWeek: number;
}

@Injectable()
export class PreCallScoringModel {
  readonly version = 'v1-precall-logistic';

  private readonly bias = -0.25;

  private readonly weights: Record<keyof PreCallFeatureVector, number> = {
    funnelStageDropDepth: -0.18,
    dropOffReasonScore: -0.35,
    daysSinceDropOff: -0.01,
    previousCallAttempts: -0.22,
    languageRiskScore: -0.12,
    stageObjectionCount: -0.03,
    historicalStageRecoveryRate: 1.5,
    hourOfDay: 0.04,
    dayOfWeek: 0.03,
  };

  predict(features: PreCallFeatureVector): number {
    const linear = (Object.keys(this.weights) as Array<keyof PreCallFeatureVector>)
      .reduce((sum, key) => sum + (this.weights[key] * features[key]), this.bias);

    const probability = 1 / (1 + Math.exp(-linear));
    return Number(Math.max(0, Math.min(1, probability)).toFixed(4));
  }
}
