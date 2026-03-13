export type LeadStatus =
  | 'pending'
  | 'scheduled'
  | 'in-call'
  | 'recovered'
  | 'failed'
  | 'escalated'
  | 'unreachable';

export interface Lead {
  id: string;
  customerId: string;
  funnelId: string;
  stageId: string;
  dropOffReason?: string;
  status: LeadStatus;
  conversionScore?: number;
  scheduledCallAt?: Date;
  lastContactedAt?: Date;
  callAttempts: number;
  metadata: Record<string, unknown>;
}