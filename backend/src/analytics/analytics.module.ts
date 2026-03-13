import { Module } from '@nestjs/common';
import { AggregateStore } from './aggregate-store';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsPipeline } from './analytics-pipeline';
import { EventBus } from './event-bus';
import { InMemoryAnalyticsStore } from './in-memory-analytics-store';
import { TimeSeriesStore } from './time-series-store';

@Module({
  providers: [InMemoryAnalyticsStore, AggregateStore, TimeSeriesStore, AnalyticsPipeline, EventBus],
  controllers: [AnalyticsController],
  exports: [InMemoryAnalyticsStore, AggregateStore, TimeSeriesStore, AnalyticsPipeline, EventBus],
})
export class AnalyticsModule {}