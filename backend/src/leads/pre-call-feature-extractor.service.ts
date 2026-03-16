import { Injectable } from '@nestjs/common';
import { InMemoryAnalyticsStore } from '../analytics/in-memory-analytics-store';
import { Lead } from '../common/models/lead.model';
import { PreCallFeatureVector } from './pre-call-scoring.model';

@Injectable()
export class PreCallFeatureExtractorService {
  constructor(private readonly analyticsStore: InMemoryAnalyticsStore) {}

  extract(lead: Lead, customerLanguage: string, now = new Date()): PreCallFeatureVector {
    const droppedAt = this.readDate(lead.metadata.droppedAt)
      ?? lead.lastContactedAt
      ?? lead.scheduledCallAt
      ?? now;

    const sessions = this.analyticsStore.listCallSessions()
      .filter((session) => session.funnelId === lead.funnelId && session.stageId === lead.stageId);
    const recovered = sessions.filter((session) => session.outcome === 'recovered').length;

    const stageObjectionCount = this.analyticsStore.listEvents()
      .filter((event) => event.type === 'objection.new')
      .filter((event) => event.payload.funnelId === lead.funnelId && event.payload.stageId === lead.stageId)
      .length;

    const scheduledAt = lead.scheduledCallAt ?? now;
    const hour = scheduledAt.getUTCHours();
    const normalizedHour = this.normalizeHour(hour);
    const dayOfWeek = this.normalizeDay(scheduledAt.getUTCDay());

    return {
      funnelStageDropDepth: this.readNumber(lead.metadata.stageDropDepth) ?? 1,
      dropOffReasonScore: this.scoreDropOffReason(lead.dropOffReason),
      daysSinceDropOff: Math.max(0, Math.floor((now.getTime() - droppedAt.getTime()) / (24 * 60 * 60 * 1000))),
      previousCallAttempts: lead.callAttempts,
      languageRiskScore: this.scoreLanguageRisk(customerLanguage),
      stageObjectionCount,
      historicalStageRecoveryRate: sessions.length === 0 ? 0.5 : recovered / sessions.length,
      hourOfDay: normalizedHour,
      dayOfWeek,
    };
  }

  private normalizeHour(hour: number): number {
    if (hour >= 10 && hour <= 12) {
      return 1;
    }
    if (hour >= 13 && hour <= 15) {
      return 0.4;
    }
    return 0.7;
  }

  private normalizeDay(day: number): number {
    if (day === 0 || day === 6) {
      return 0.3;
    }
    return 0.8;
  }

  private scoreDropOffReason(reason?: string): number {
    if (!reason) {
      return 0.3;
    }

    const normalized = reason.toLowerCase();
    if (normalized.includes('not interested') || normalized.includes('declined')) {
      return 1;
    }
    if (normalized.includes('otp') || normalized.includes('verification')) {
      return 0.35;
    }
    return 0.5;
  }

  private scoreLanguageRisk(language: string): number {
    const normalized = language.trim().toLowerCase();
    if (normalized === 'en-in') {
      return 0.1;
    }
    if (normalized === 'hi-in') {
      return 0.12;
    }
    return 0.2;
  }

  private readDate(value: unknown): Date | undefined {
    if (typeof value !== 'string' && !(value instanceof Date)) {
      return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private readNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }
}
