import { Injectable, NotFoundException } from '@nestjs/common';
import { mockFunnels } from '../adapters/crm/mock-crm.data';
import { Funnel } from '../common/models/funnel.model';

@Injectable()
export class FunnelsService {
  private readonly funnels = structuredClone(mockFunnels);

  list(): Funnel[] {
    return structuredClone(this.funnels);
  }

  update(id: string, patch: Partial<Funnel>): Funnel {
    const index = this.funnels.findIndex((entry) => entry.id === id);
    if (index < 0) {
      throw new NotFoundException(`Funnel not found: ${id}`);
    }

    const existing = this.funnels[index];
    const updated: Funnel = {
      ...existing,
      ...sanitizePatch(patch),
      id: existing.id,
      stages: Array.isArray(patch.stages) ? patch.stages : existing.stages,
      policies: Array.isArray(patch.policies) ? patch.policies : existing.policies,
    };

    this.funnels[index] = updated;
    return structuredClone(updated);
  }
}

function sanitizePatch(input: Partial<Funnel>): Partial<Funnel> {
  const patch = { ...input };
  delete patch.id;
  return patch;
}
