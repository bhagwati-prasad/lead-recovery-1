import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { TTSAdapter, TTSRequest, TTSResponse } from './tts-adapter.interface';

@Injectable()
export class MockTTSAdapter implements TTSAdapter {
  async synthesize(req: TTSRequest): Promise<TTSResponse> {
    const cacheKey = createHash('sha256').update(`${req.text}|${req.voiceId}|${req.language}`).digest('hex');
    const audioBuffer = Buffer.from(`MOCK_TTS:${req.text}`, 'utf8');
    return {
      audioBuffer,
      durationSeconds: Math.max(1, Math.ceil(req.text.length / 24)),
      cacheKey,
    };
  }
}
