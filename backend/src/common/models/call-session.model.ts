export interface TranscriptEntry {
  timestamp: Date;
  speaker: 'agent' | 'customer';
  text: string;
  audioRef?: string;
}

export type CallSessionStatus = 'preparing' | 'initiating' | 'active' | 'completed' | 'failed';

export interface CallSession {
  id: string;
  leadId: string;
  customerId: string;
  funnelId: string;
  stageId: string;
  startedAt?: Date;
  endedAt?: Date;
  status: CallSessionStatus;
  durationSeconds?: number;
  transcript: TranscriptEntry[];
  moduleOutputs: Record<string, Record<string, unknown>>;
  assessmentScore?: number;
  outcome?: 'recovered' | 'failed' | 'escalated';
}