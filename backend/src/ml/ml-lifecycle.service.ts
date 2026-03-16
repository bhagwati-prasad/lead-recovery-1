import { Injectable } from '@nestjs/common';
import { AggregateStore } from '../analytics/aggregate-store';
import { EventBus } from '../analytics/event-bus';
import { InMemoryAnalyticsStore } from '../analytics/in-memory-analytics-store';
import { CallSession } from '../common/models/call-session.model';
import { ModelRegistry } from './model-registry';
import {
  ModelEvaluationMetrics,
  ModelType,
  ModelVersionManager,
  ModelVersionRecord,
} from './model-version-manager.service';

export type TrainingTrigger = 'manual' | 'weekly' | 'threshold';

export interface TrainingResult {
  trigger: TrainingTrigger;
  promoted: boolean;
  modelVersion: string;
  previousVersion: string;
  sampleCount: number;
  metrics: ModelEvaluationMetrics;
  reason: string;
  consecutiveFailures: number;
}

@Injectable()
export class MlLifecycleService {
  constructor(
    private readonly modelRegistry: ModelRegistry,
    private readonly analyticsStore: InMemoryAnalyticsStore,
    private readonly aggregateStore: AggregateStore,
    private readonly modelVersionManager: ModelVersionManager,
    private readonly eventBus: EventBus,
  ) {
    const currentModel = this.modelRegistry.getActive();
    this.modelVersionManager.initialize({
      version: currentModel.version,
      modelType: this.resolveModelType(currentModel.version),
      trainedAt: new Date(),
      sampleCount: 0,
      metrics: {
        aucRoc: 0.6,
        precision: 0.55,
        recall: 0.52,
        calibrationError: 0.2,
        fairnessGap: 0.08,
      },
      promoted: true,
      reason: 'initial baseline',
    });
  }

  train(trigger: TrainingTrigger): TrainingResult {
    const current = this.modelVersionManager.getCurrentPromoted();
    const sessions = this.selectTrainingSessions(this.analyticsStore.listCallSessions(), trigger);
    const sampleCount = sessions.length;
    const candidateVersion = this.selectModelVersion(sampleCount);
    const metrics = this.evaluate(candidateVersion, sampleCount);

    const isBetterModel = metrics.aucRoc - current.metrics.aucRoc >= 0.02;
    const versionChanged = current.version !== candidateVersion;
    const shouldPromote = isBetterModel && versionChanged;

    if (shouldPromote) {
      this.modelRegistry.use(candidateVersion);
      this.aggregateStore.set('models.currentAucRoc', metrics.aucRoc);
      this.eventBus.emit({
        type: 'model.promoted',
        payload: {
          modelVersion: candidateVersion,
          previousVersion: current.version,
          trigger,
          aucRoc: metrics.aucRoc,
          precision: metrics.precision,
          recall: metrics.recall,
          sampleCount,
        },
      });
    }

    const reason = shouldPromote
      ? `promoted: AUC-ROC improved by ${(metrics.aucRoc - current.metrics.aucRoc).toFixed(4)}`
      : isBetterModel
        ? 'candidate equals current model version'
        : `not promoted: delta ${(metrics.aucRoc - current.metrics.aucRoc).toFixed(4)} below threshold 0.0200`;

    const record: ModelVersionRecord = {
      version: candidateVersion,
      modelType: this.resolveModelType(candidateVersion),
      trainedAt: new Date(),
      sampleCount,
      metrics,
      promoted: shouldPromote,
      reason,
    };

    this.modelVersionManager.recordTraining(record);

    return {
      trigger,
      promoted: shouldPromote,
      modelVersion: candidateVersion,
      previousVersion: current.version,
      sampleCount,
      metrics,
      reason,
      consecutiveFailures: this.modelVersionManager.getConsecutiveFailedTrainings(),
    };
  }

  rollback(): { currentVersion: string; restoredVersion: string; restoredAt: Date } {
    const promoted = this.modelVersionManager
      .getHistory()
      .filter((entry) => entry.promoted)
      .sort((a, b) => b.trainedAt.getTime() - a.trainedAt.getTime());

    if (promoted.length < 2) {
      throw new Error('No previous promoted model available for rollback');
    }

    const current = promoted[0];
    const previous = promoted[1];
    this.modelRegistry.use(previous.version);

    this.modelVersionManager.recordTraining({
      ...previous,
      trainedAt: new Date(),
      promoted: true,
      reason: `rollback from ${current.version}`,
    });

    this.eventBus.emit({
      type: 'model.promoted',
      payload: {
        modelVersion: previous.version,
        previousVersion: current.version,
        trigger: 'rollback',
        aucRoc: previous.metrics.aucRoc,
        precision: previous.metrics.precision,
        recall: previous.metrics.recall,
        sampleCount: previous.sampleCount,
      },
    });

    return {
      currentVersion: current.version,
      restoredVersion: previous.version,
      restoredAt: new Date(),
    };
  }

  getCurrent() {
    const current = this.modelVersionManager.getCurrentPromoted();
    return {
      current,
      livePerformance: {
        conversionRate: this.aggregateStore.snapshot().conversionRate,
        callsTotal: this.aggregateStore.snapshot().callsTotal,
        averageCallDuration: this.aggregateStore.snapshot().avgCallDuration,
      },
      failureAlerts: {
        consecutiveFailedTrainings: this.modelVersionManager.getConsecutiveFailedTrainings(),
        alert: this.modelVersionManager.getConsecutiveFailedTrainings() >= 3,
      },
    };
  }

  getHistory(): ModelVersionRecord[] {
    return this.modelVersionManager.getHistory();
  }

  private selectTrainingSessions(sessions: CallSession[], trigger: TrainingTrigger): CallSession[] {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const matured = sessions.filter((session) => (session.endedAt?.getTime() ?? 0) <= cutoff);
    if (matured.length > 0) {
      return matured.slice(-50000);
    }

    if (trigger === 'manual') {
      return sessions.slice(-50000);
    }

    return [];
  }

  private selectModelVersion(sampleCount: number): string {
    if (sampleCount >= 500) {
      return 'v2-gboost';
    }
    return 'v1-logistic';
  }

  private evaluate(version: string, sampleCount: number): ModelEvaluationMetrics {
    const dataBoost = Math.min(0.12, Math.log10(sampleCount + 10) * 0.03);

    if (version === 'v2-gboost') {
      return {
        aucRoc: this.round4(0.62 + dataBoost),
        precision: this.round4(0.58 + dataBoost * 0.6),
        recall: this.round4(0.56 + dataBoost * 0.8),
        calibrationError: this.round4(Math.max(0.03, 0.16 - dataBoost * 0.7)),
        fairnessGap: this.round4(Math.max(0.01, 0.1 - dataBoost * 0.5)),
      };
    }

    if (version === 'v1-logistic') {
      return {
        aucRoc: this.round4(0.6 + dataBoost * 0.8),
        precision: this.round4(0.55 + dataBoost * 0.5),
        recall: this.round4(0.52 + dataBoost * 0.6),
        calibrationError: this.round4(Math.max(0.04, 0.2 - dataBoost * 0.5)),
        fairnessGap: this.round4(Math.max(0.02, 0.08 - dataBoost * 0.3)),
      };
    }

    return {
      aucRoc: 0.5,
      precision: 0.5,
      recall: 0.5,
      calibrationError: 0.25,
      fairnessGap: 0.1,
    };
  }

  private resolveModelType(version: string): ModelType {
    if (version.includes('gboost')) {
      return 'gradient-boosted-trees';
    }
    if (version.includes('logistic')) {
      return 'logistic-regression';
    }
    return 'mock';
  }

  private round4(value: number): number {
    return Number(value.toFixed(4));
  }
}
