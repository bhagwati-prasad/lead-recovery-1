import { Injectable } from '@nestjs/common';
import { STTAdapter, STTRequest, STTResponse } from './stt-adapter.interface';

@Injectable()
export class MockSTTAdapter implements STTAdapter {
  async transcribe(req: STTRequest): Promise<STTResponse> {
    const transcript = req.audioBuffer.toString('utf8').replace(/^AUDIO:/, '').trim();
    return {
      transcript,
      confidence: transcript.length > 0 ? 0.95 : 0.4,
      language: req.language,
    };
  }
}
