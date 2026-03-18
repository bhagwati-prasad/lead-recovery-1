import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InMemoryAnalyticsStore } from '../analytics/in-memory-analytics-store';
import { PendingObjectionQueueService } from '../services/pending-objection-queue.service';
import { FunnelSuggestion, SuggestionStatus } from './suggestion.types';

@Injectable()
export class SuggestionEngineService {
  private readonly suggestions = new Map<string, FunnelSuggestion>();

  constructor(
    private readonly analyticsStore: InMemoryAnalyticsStore,
    private readonly pendingObjectionQueueService: PendingObjectionQueueService,
  ) {}

  run(): FunnelSuggestion[] {
    const generated: FunnelSuggestion[] = [];
    const sessions = this.analyticsStore.listCallSessions();

    const byFunnelStage = new Map<string, { recovered: number; escalated: number; total: number }>();
    for (const session of sessions) {
      const key = `${session.funnelId}::${session.stageId}`;
      const current = byFunnelStage.get(key) ?? { recovered: 0, escalated: 0, total: 0 };
      current.total += 1;
      if (session.outcome === 'recovered') {
        current.recovered += 1;
      }
      if (session.outcome === 'escalated') {
        current.escalated += 1;
      }
      byFunnelStage.set(key, current);
    }

    for (const [key, stats] of byFunnelStage.entries()) {
      const [funnelId, stageId] = key.split('::');
      const recoveryRate = stats.total === 0 ? 0 : stats.recovered / stats.total;
      const escalationRate = stats.total === 0 ? 0 : stats.escalated / stats.total;

      if (stats.total >= 30 && recoveryRate < 0.5) {
        generated.push(this.upsert({
          funnelId,
          stageId,
          type: 'adjust-max-turns',
          title: 'Stage recovery is below threshold',
          description: 'Recovery rate is below 50% over at least 30 calls. Consider increasing max turns and refreshing scripts.',
          impact: 'high',
          evidence: {
            metric: 'stageRecoveryRate',
            currentValue: Number(recoveryRate.toFixed(4)),
            benchmarkValue: 0.5,
            sampleSize: stats.total,
          },
        }));
      }

      if (stats.total >= 20 && escalationRate > 0.4) {
        generated.push(this.upsert({
          funnelId,
          stageId,
          type: 'escalation-threshold-adjustment',
          title: 'Escalation rate spike detected',
          description: 'Escalation rate exceeded 40% for this stage. Revisit exception thresholds and objection scripts.',
          impact: 'medium',
          evidence: {
            metric: 'stageEscalationRate',
            currentValue: Number(escalationRate.toFixed(4)),
            benchmarkValue: 0.25,
            sampleSize: stats.total,
          },
        }));
      }
    }

    const pendingQueue = this.pendingObjectionQueueService
      .list()
      .filter((item) => item.status === 'pending');

    if (pendingQueue.length >= 10) {
      const first = pendingQueue[0];
      generated.push(this.upsert({
        funnelId: first?.funnelId ?? 'unknown',
        stageId: first?.stageId,
        type: 'update-objection-script',
        title: 'Pending objections queue is growing',
        description: 'More than 10 objections are pending review. Add or update objection scripts for high-frequency objections.',
        impact: 'high',
        evidence: {
          metric: 'pendingObjections',
          currentValue: pendingQueue.length,
          benchmarkValue: 10,
          sampleSize: pendingQueue.length,
        },
      }));
    }

    return generated;
  }

  list(filters?: { funnelId?: string; status?: SuggestionStatus }): FunnelSuggestion[] {
    return [...this.suggestions.values()]
      .filter((entry) => !filters?.funnelId || entry.funnelId === filters.funnelId)
      .filter((entry) => !filters?.status || entry.status === filters.status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((entry) => structuredClone(entry));
  }

  accept(id: string): FunnelSuggestion {
    const item = this.getRequired(id);
    item.status = 'accepted';
    item.resolvedAt = new Date();
    return structuredClone(item);
  }

  dismiss(id: string, reason?: string): FunnelSuggestion {
    const item = this.getRequired(id);
    item.status = 'dismissed';
    item.resolvedAt = new Date();
    item.resolutionReason = reason;
    return structuredClone(item);
  }

  pendingHighImpactCount(): number {
    return [...this.suggestions.values()].filter((entry) => entry.status === 'pending' && entry.impact === 'high').length;
  }

  private upsert(
    input: Omit<FunnelSuggestion, 'id' | 'status' | 'createdAt' | 'resolvedAt' | 'resolutionReason'>,
  ): FunnelSuggestion {
    const key = `${input.funnelId}:${input.stageId ?? 'all'}:${input.type}`;
    const existing = this.suggestions.get(key);
    if (existing && existing.status === 'pending') {
      existing.evidence = input.evidence;
      existing.description = input.description;
      return structuredClone(existing);
    }

    const suggestion: FunnelSuggestion = {
      id: `sug_${randomUUID()}`,
      ...input,
      status: 'pending',
      createdAt: new Date(),
    };

    this.suggestions.set(key, suggestion);
    return structuredClone(suggestion);
  }

  private getRequired(id: string): FunnelSuggestion {
    const match = [...this.suggestions.values()].find((entry) => entry.id === id);
    if (!match) {
      throw new Error(`Suggestion not found: ${id}`);
    }
    return match;
  }
}
