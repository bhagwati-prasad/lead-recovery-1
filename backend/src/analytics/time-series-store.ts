import { Injectable } from '@nestjs/common';
import { AnalyticsQuery, AnalyticsResult } from './analytics.types';

interface MetricPoint {
  metric: string;
  timestamp: Date;
  value: number;
  tags?: Record<string, string>;
}

@Injectable()
export class TimeSeriesStore {
  private readonly points: MetricPoint[] = [];
  private readonly retentionDays = 30;

  append(point: MetricPoint): void {
    this.points.push(structuredClone(point));
    this.trimRetention();
  }

  query(query: AnalyticsQuery): AnalyticsResult {
    const points = this.points
      .filter((entry) => entry.metric === query.metric)
      .filter((entry) => entry.timestamp >= query.from && entry.timestamp <= query.to)
      .filter((entry) => this.matchesFilters(entry, query.filters));

    const values = points.map((entry) => entry.value);
    const sum = values.reduce((acc, value) => acc + value, 0);

    return {
      metric: query.metric,
      dataPoints: points.map((entry) => ({ timestamp: entry.timestamp, value: entry.value })),
      aggregates: {
        sum,
        avg: values.length === 0 ? 0 : sum / values.length,
        min: values.length === 0 ? 0 : Math.min(...values),
        max: values.length === 0 ? 0 : Math.max(...values),
      },
    };
  }

  private trimRetention(): void {
    const cutoff = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    while (this.points.length > 0 && this.points[0].timestamp.getTime() < cutoff) {
      this.points.shift();
    }
  }

  private matchesFilters(point: MetricPoint, filters?: Record<string, string | undefined>): boolean {
    if (!filters) {
      return true;
    }

    return Object.entries(filters).every(([key, value]) => value === undefined || point.tags?.[key] === value);
  }
}