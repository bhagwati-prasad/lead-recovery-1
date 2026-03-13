import { FeatureVector } from '../modules/phase4.types';

export interface MLAssessmentModel {
  readonly version: string;
  predict(features: FeatureVector): Promise<number>;
}