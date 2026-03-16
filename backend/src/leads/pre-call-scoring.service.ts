import { Injectable } from '@nestjs/common';
import { Lead } from '../common/models/lead.model';
import { PreCallFeatureExtractorService } from './pre-call-feature-extractor.service';
import { PreCallScoringModel } from './pre-call-scoring.model';

export interface LeadScoreSnapshot {
  leadId: string;
  conversionProbability: number;
  modelVersion: string;
  computedAt: Date;
}

@Injectable()
export class PreCallScoringService {
  private readonly scores = new Map<string, LeadScoreSnapshot>();

  constructor(
    private readonly featureExtractor: PreCallFeatureExtractorService,
    private readonly preCallScoringModel: PreCallScoringModel,
  ) {}

  scoreLead(lead: Lead, customerLanguage: string): LeadScoreSnapshot {
    const features = this.featureExtractor.extract(lead, customerLanguage);
    const snapshot: LeadScoreSnapshot = {
      leadId: lead.id,
      conversionProbability: this.preCallScoringModel.predict(features),
      modelVersion: this.preCallScoringModel.version,
      computedAt: new Date(),
    };

    this.scores.set(lead.id, snapshot);
    return structuredClone(snapshot);
  }

  getLeadScore(leadId: string): LeadScoreSnapshot | undefined {
    const cached = this.scores.get(leadId);
    return cached ? structuredClone(cached) : undefined;
  }

  scoreAndSort(leads: Lead[], languageByCustomerId: Map<string, string>): Lead[] {
    const scored = leads.map((lead) => {
      const language = languageByCustomerId.get(lead.customerId) ?? 'en-IN';
      const snapshot = this.scoreLead(lead, language);
      return {
        ...lead,
        conversionScore: snapshot.conversionProbability,
      };
    });

    return scored.sort((a, b) => (b.conversionScore ?? 0) - (a.conversionScore ?? 0));
  }
}
