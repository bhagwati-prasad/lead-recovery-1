export interface CachedAudio {
  buffer: Buffer;
  durationSeconds: number;
  reference: string;
}

export interface AudioCache {
  get(cacheKey: string): Promise<CachedAudio | undefined>;
  put(cacheKey: string, value: CachedAudio): Promise<void>;
}
