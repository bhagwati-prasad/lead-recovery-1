export interface Objection {
  id: string;
  type: 'system' | 'customer';
  title: string;
  description: string;
  handlingScript?: string;
  escalate: boolean;
}

export interface Policy {
  id: string;
  scope: 'funnel' | 'stage' | 'system';
  key: string;
  value: string;
  description: string;
}

export interface Stage {
  id: string;
  funnelId: string;
  title: string;
  goal: string;
  description: string;
  order: number;
  isParallel: boolean;
  policies: Policy[];
  systemObjections: Objection[];
  customerObjections: Objection[];
}

export interface Funnel {
  id: string;
  productId: string;
  title: string;
  description: string;
  stages: Stage[];
  policies: Policy[];
  isActive: boolean;
}

export interface ProgressionEvent {
  stageId: string;
  enteredAt: Date;
  exitedAt?: Date;
  outcome: 'completed' | 'dropped' | 'skipped';
  notes?: string;
}

export interface FunnelContext {
  customerId: string;
  funnelId: string;
  currentStageId: string;
  completedStageIds: string[];
  progressionHistory: ProgressionEvent[];
  anticipatedObjections: Objection[];
}