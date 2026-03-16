export type SuggestionImpact = 'high' | 'medium' | 'low';
export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed';

export type SuggestionType =
  | 'add-objection-script'
  | 'update-objection-script'
  | 'adjust-max-turns'
  | 'change-call-time-window'
  | 'reprioritise-stage'
  | 'escalation-threshold-adjustment';

export interface SuggestionEvidence {
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  sampleSize: number;
}

export interface FunnelSuggestion {
  id: string;
  funnelId: string;
  stageId?: string;
  type: SuggestionType;
  title: string;
  description: string;
  evidence: SuggestionEvidence;
  impact: SuggestionImpact;
  status: SuggestionStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolutionReason?: string;
}
