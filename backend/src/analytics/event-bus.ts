import { Injectable } from '@nestjs/common';
import { AnalyticsPipeline } from './analytics-pipeline';
import { InMemoryAnalyticsStore } from './in-memory-analytics-store';

export type AnalyticsEvent =
  | { type: 'call.completed'; payload: Record<string, unknown> }
  | { type: 'objection.new'; payload: Record<string, unknown> }
  | { type: 'goal.achieved'; payload: Record<string, unknown> }
  | { type: 'lead.recovered'; payload: Record<string, unknown> }
  | { type: 'lead.escalated'; payload: Record<string, unknown> }
  | { type: 'workflow.failed'; payload: Record<string, unknown> };

@Injectable()
export class EventBus {
  constructor(
    private readonly analyticsStore: InMemoryAnalyticsStore,
    private readonly analyticsPipeline: AnalyticsPipeline,
  ) {}

  emit(event: AnalyticsEvent): void {
    this.analyticsStore.recordEvent(event);
    this.analyticsPipeline.process(event);
  }
}