import { Injectable } from '@nestjs/common';
import { AudioCache, CachedAudio } from './audio-cache.interface';

@Injectable()
export class LocalAudioCache implements AudioCache {
  private readonly entries = new Map<string, CachedAudio>();

  async get(cacheKey: string): Promise<CachedAudio | undefined> {
    return this.entries.get(cacheKey);
  }

  async put(cacheKey: string, value: CachedAudio): Promise<void> {
    this.entries.set(cacheKey, value);
  }
}
