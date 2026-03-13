import { Injectable } from '@nestjs/common';
import { mockFunnels } from '../adapters/crm/mock-crm.data';
import { Objection } from '../common/models/funnel.model';

@Injectable()
export class ObjectionDatabaseService {
  async getForStage(funnelId: string, stageId: string): Promise<Objection[]> {
    const funnel = mockFunnels.find((entry) => entry.id === funnelId);
    if (!funnel) {
      return [];
    }
    const stage = funnel.stages.find((entry) => entry.id === stageId);
    if (!stage) {
      return [];
    }
    return [...stage.customerObjections, ...stage.systemObjections].map((entry) => ({ ...entry }));
  }
}
