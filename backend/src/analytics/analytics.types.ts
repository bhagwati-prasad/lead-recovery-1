export interface AnalyticsQuery {
  metric: string;
  from: Date;
  to: Date;
  groupBy?: 'day' | 'week' | 'month';
  filters?: {
    funnelId?: string;
    stageId?: string;
    productId?: string;
    modelVersion?: string;
  };
}

export interface AnalyticsResult {
  metric: string;
  dataPoints: Array<{ timestamp: Date; value: number }>;
  aggregates: {
    sum: number;
    avg: number;
    min: number;
    max: number;
  };
}

export interface MetricsSnapshot {
  callsTotal: number;
  callsRecovered: number;
  callsEscalated: number;
  callsFailed: number;
  objectionsEncountered: number;
  conversionRate: number;
  avgCallDuration: number;
}