import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class CorrelationIdService {
  private readonly storage = new AsyncLocalStorage<string>();

  run<T>(correlationId: string, callback: () => T): T {
    return this.storage.run(correlationId, callback);
  }

  getCorrelationId(): string | undefined {
    return this.storage.getStore();
  }
}