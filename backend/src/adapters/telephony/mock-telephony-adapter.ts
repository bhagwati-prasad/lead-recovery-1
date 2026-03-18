import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CallInitiationRequest, TelephonyAdapter, TelephonyCallSession } from './telephony-adapter.interface';

@Injectable()
export class MockTelephonyAdapter implements TelephonyAdapter {
  private readonly activeCalls = new Set<string>();

  async initiateCall(_req: CallInitiationRequest): Promise<TelephonyCallSession> {
    const providerCallId = `mock_call_${randomUUID()}`;
    this.activeCalls.add(providerCallId);
    return {
      providerCallId,
      status: 'answered',
    };
  }

  async hangUp(providerCallId: string): Promise<void> {
    this.activeCalls.delete(providerCallId);
  }

  async streamAudio(providerCallId: string, _audio: Buffer): Promise<void> {
    if (!this.activeCalls.has(providerCallId)) {
      throw new Error(`Call not active: ${providerCallId}`);
    }
  }
}
