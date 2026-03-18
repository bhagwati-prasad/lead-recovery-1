import { Injectable } from '@nestjs/common';

export type ModelType = 'logistic-regression' | 'gradient-boosted-trees' | 'mock';

export interface ModelEvaluationMetrics {
  aucRoc: number;
  precision: number;
  recall: number;
  calibrationError: number;
  fairnessGap: number;
}

export interface ModelVersionRecord {
  version: string;
  modelType: ModelType;
  trainedAt: Date;
  sampleCount: number;
  metrics: ModelEvaluationMetrics;
  promoted: boolean;
  reason?: string;
}

@Injectable()
export class ModelVersionManager {
  private readonly history: ModelVersionRecord[] = [];
  private consecutiveFailedTrainings = 0;

  initialize(initial: ModelVersionRecord): void {
    if (this.history.length > 0) {
      return;
    }
    this.history.push(structuredClone(initial));
  }

  recordTraining(record: ModelVersionRecord): void {
    this.history.push(structuredClone(record));
    if (record.promoted) {
      this.consecutiveFailedTrainings = 0;
      return;
    }
    this.consecutiveFailedTrainings += 1;
  }

  getHistory(): ModelVersionRecord[] {
    return structuredClone(this.history).sort((a, b) => b.trainedAt.getTime() - a.trainedAt.getTime());
  }

  getCurrentPromoted(): ModelVersionRecord {
    const promoted = this.history
      .filter((record) => record.promoted)
      .sort((a, b) => b.trainedAt.getTime() - a.trainedAt.getTime());
    if (promoted.length === 0) {
      throw new Error('No promoted model version found');
    }
    return structuredClone(promoted[0]);
  }

  getConsecutiveFailedTrainings(): number {
    return this.consecutiveFailedTrainings;
  }
}
