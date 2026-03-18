import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface PendingObjection {
  id: string;
  callSessionId: string;
  funnelId: string;
  stageId: string;
  customerText: string;
  similarObjectionIds: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

@Injectable()
export class PendingObjectionQueueService {
  private readonly queue = new Map<string, PendingObjection>();

  enqueue(input: Omit<PendingObjection, 'id' | 'status' | 'createdAt'>): PendingObjection {
    const item: PendingObjection = {
      id: `pending_obj_${randomUUID()}`,
      ...input,
      status: 'pending',
      createdAt: new Date(),
    };
    this.queue.set(item.id, item);
    return structuredClone(item);
  }

  list(): PendingObjection[] {
    return [...this.queue.values()].map((entry) => structuredClone(entry));
  }

  approve(id: string): PendingObjection {
    const item = this.getRequired(id);
    item.status = 'approved';
    return structuredClone(item);
  }

  reject(id: string): PendingObjection {
    const item = this.getRequired(id);
    item.status = 'rejected';
    return structuredClone(item);
  }

  private getRequired(id: string): PendingObjection {
    const item = this.queue.get(id);
    if (!item) {
      throw new Error(`Pending objection not found: ${id}`);
    }
    return item;
  }
}