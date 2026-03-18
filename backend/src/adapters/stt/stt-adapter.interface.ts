export interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface STTRequest {
  audioBuffer: Buffer;
  language: string;
  sampleRateHz: number;
  encoding: 'wav' | 'mp3' | 'ogg';
}

export interface STTResponse {
  transcript: string;
  confidence: number;
  language: string;
  wordTimings?: WordTiming[];
}

export interface STTAdapter {
  transcribe(req: STTRequest): Promise<STTResponse>;
}
