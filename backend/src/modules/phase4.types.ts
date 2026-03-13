export interface SentimentResult {
  score: number;
  magnitude: number;
  label: 'positive' | 'negative' | 'neutral';
}

export interface SentimentTimeline {
  entries: Array<{ timestamp: Date; score: number }>;
  overallScore: number;
  slope: number;
}

export interface FeatureVector {
  goalAchievementRate: number;
  totalTurns: number;
  turnsToFirstGoal: number;
  objectionCount: number;
  resolvedObjectionRate: number;
  hardRejectionEncountered: number;
  escalationTriggered: number;
  sentimentTrajectory: number;
  callDurationSeconds: number;
  avgAgentResponseMs: number;
  stageDropDepth: number;
  previousCallAttempts: number;
}

export type AssessmentRecommendation =
  | 'close-recovered'
  | 'schedule-follow-up'
  | 'escalate-warm'
  | 'escalate-cold'
  | 'close-failed';

export interface AssessmentFactorV2 {
  name: string;
  value: number;
  weight: number;
}

export interface AccomplishmentAssessmentResult {
  conversionProbability: number;
  goalAchievementRate: number;
  momentumScore: number;
  rejectionConfidence: number;
  objectionsResolved: number;
  objectionsUnresolved: number;
  recommendation: AssessmentRecommendation;
  modelVersion: string;
  factors: AssessmentFactorV2[];
}