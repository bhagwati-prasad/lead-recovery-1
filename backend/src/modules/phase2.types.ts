import { Objection } from '../common/models/funnel.model';

export interface AgentPersona {
  name: string;
  language: string;
  tone: string;
  voiceId: string;
}

export interface ConversationGoal {
  id: string;
  description: string;
  completionSignal: string;
  isMandatory: boolean;
}

export interface ObjectionScript {
  objectionId: string;
  script: string;
}

export interface ConversationStrategy {
  systemPrompt: string;
  anticipatedObjections: Objection[];
  resolutionScripts: ObjectionScript[];
  agentPersona: AgentPersona;
  maxTurns: number;
  goals: ConversationGoal[];
}

export type ConversationEndReason =
  | 'goal-achieved'
  | 'max-turns-reached'
  | 'customer-declined'
  | 'customer-hung-up'
  | 'escalation-triggered'
  | 'error';

export interface AssessmentFactor {
  name: string;
  weight: number;
  value: number;
  label: string;
}

export interface AssessmentResult {
  score: number;
  factors: AssessmentFactor[];
  recommendation: 'close-recovered' | 'schedule-follow-up' | 'escalate' | 'close-failed';
}
