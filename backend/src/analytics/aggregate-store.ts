import { Injectable } from '@nestjs/common';
import { MetricsSnapshot } from './analytics.types';

@Injectable()
export class AggregateStore {
  private readonly counters = new Map<string, number>();

  increment(metric: string, value = 1): void {
    this.counters.set(metric, (this.counters.get(metric) ?? 0) + value);
  }

  set(metric: string, value: number): void {
    this.counters.set(metric, value);
  }

  get(metric: string): number {
    return this.counters.get(metric) ?? 0;
  }

  snapshot(): MetricsSnapshot {
    const callsTotal = this.get('calls.total');
    const callsRecovered = this.get('calls.recovered');
    const callsEscalated = this.get('calls.escalated');
    const callsFailed = this.get('calls.failed');
    const objectionsEncountered = this.get('objections.encountered');
    const avgCallDuration = this.get('calls.totalDuration') / Math.max(1, callsTotal);

    return {
      callsTotal,
      callsRecovered,
      callsEscalated,
      callsFailed,
      objectionsEncountered,
      conversionRate: callsRecovered / Math.max(1, callsTotal),
      avgCallDuration: Number(avgCallDuration.toFixed(2)),
    };
  }
}