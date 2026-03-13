import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AggregateStore } from './aggregate-store';
import { AnalyticsQuery } from './analytics.types';
import { TimeSeriesStore } from './time-series-store';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly aggregateStore: AggregateStore,
    private readonly timeSeriesStore: TimeSeriesStore,
  ) {}

  @Get('summary')
  getSummary() {
    return {
      summary: this.aggregateStore.snapshot(),
    };
  }

  @Get('metrics')
  getMetrics(
    @Query('metric') metric?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('funnelId') funnelId?: string,
    @Query('stageId') stageId?: string,
    @Query('productId') productId?: string,
  ) {
    if (!metric) {
      throw new BadRequestException('metric query parameter is required');
    }

    const parsedFrom = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const parsedTo = to ? new Date(to) : new Date();
    if (Number.isNaN(parsedFrom.getTime()) || Number.isNaN(parsedTo.getTime())) {
      throw new BadRequestException('from and to must be valid ISO date values');
    }

    const query: AnalyticsQuery = {
      metric,
      from: parsedFrom,
      to: parsedTo,
      filters: {
        funnelId,
        stageId,
        productId,
      },
    };

    return this.timeSeriesStore.query(query);
  }
}