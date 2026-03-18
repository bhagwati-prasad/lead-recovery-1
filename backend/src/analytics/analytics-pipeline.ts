import { Injectable } from '@nestjs/common';
import { AnalyticsEvent } from './event-bus';
import { AggregateStore } from './aggregate-store';
import { TimeSeriesStore } from './time-series-store';

@Injectable()
export class AnalyticsPipeline {
  constructor(
    private readonly aggregateStore: AggregateStore,
    private readonly timeSeriesStore: TimeSeriesStore,
  ) {}

  process(event: AnalyticsEvent): void {
    const timestamp = new Date();

    switch (event.type) {
      case 'call.completed': {
        const duration = this.readNumber(event.payload.durationSeconds);
        this.aggregateStore.increment('calls.total');
        this.aggregateStore.increment('calls.totalDuration', duration ?? 0);
        this.timeSeriesStore.append({ metric: 'calls.total', timestamp, value: 1, tags: this.extractTags(event.payload) });
        if (duration !== undefined) {
          this.timeSeriesStore.append({ metric: 'avgCallDuration', timestamp, value: duration, tags: this.extractTags(event.payload) });
        }

        const outcome = this.readString(event.payload.outcome);
        if (outcome === 'recovered') {
          this.aggregateStore.increment('calls.recovered');
        }
        if (outcome === 'escalated') {
          this.aggregateStore.increment('calls.escalated');
        }
        if (outcome === 'failed') {
          this.aggregateStore.increment('calls.failed');
        }
        break;
      }
      case 'objection.new':
        this.aggregateStore.increment('objections.encountered');
        this.timeSeriesStore.append({ metric: 'objections.encountered', timestamp, value: 1, tags: this.extractTags(event.payload) });
        break;
      case 'lead.recovered':
        this.timeSeriesStore.append({ metric: 'calls.recovered', timestamp, value: 1, tags: this.extractTags(event.payload) });
        break;
      case 'lead.escalated':
        this.timeSeriesStore.append({ metric: 'calls.escalated', timestamp, value: 1, tags: this.extractTags(event.payload) });
        break;
      case 'model.promoted': {
        const aucRoc = this.readNumber(event.payload.aucRoc);
        if (aucRoc !== undefined) {
          this.aggregateStore.set('models.currentAucRoc', aucRoc);
          this.timeSeriesStore.append({ metric: 'models.aucRoc', timestamp, value: aucRoc, tags: this.extractTags(event.payload) });
        }

        const precision = this.readNumber(event.payload.precision);
        if (precision !== undefined) {
          this.timeSeriesStore.append({ metric: 'models.precision', timestamp, value: precision, tags: this.extractTags(event.payload) });
        }

        const recall = this.readNumber(event.payload.recall);
        if (recall !== undefined) {
          this.timeSeriesStore.append({ metric: 'models.recall', timestamp, value: recall, tags: this.extractTags(event.payload) });
        }
        break;
      }
      default:
        break;
    }
  }

  private extractTags(payload: Record<string, unknown>): Record<string, string> {
    const tags: Record<string, string> = {};
    for (const key of ['funnelId', 'stageId', 'productId', 'modelVersion']) {
      const value = this.readString(payload[key]);
      if (value) {
        tags[key] = value;
      }
    }
    return tags;
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private readNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }
}