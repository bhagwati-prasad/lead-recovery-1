export interface TTSRequest {
  text: string;
  voiceId: string;
  language: string;
  stability?: number;
  similarityBoost?: number;
}

export interface TTSResponse {
  audioBuffer: Buffer;
  durationSeconds: number;
  cacheKey: string;
}

export interface TTSAdapter {
  synthesize(req: TTSRequest): Promise<TTSResponse>;
}
