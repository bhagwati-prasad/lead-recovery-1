export interface CallInitiationRequest {
  fromNumber: string;
  toNumber: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}

export interface TelephonyCallSession {
  providerCallId: string;
  status: 'ringing' | 'answered' | 'completed' | 'failed';
}

export interface TelephonyAdapter {
  initiateCall(req: CallInitiationRequest): Promise<TelephonyCallSession>;
  hangUp(providerCallId: string): Promise<void>;
  streamAudio(providerCallId: string, audio: Buffer): Promise<void>;
}
