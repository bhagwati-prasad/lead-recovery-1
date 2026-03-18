import { BadRequestException, Controller, Get, Inject, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { CRM_ADAPTER } from '../adapters/crm/crm.tokens';
import { CRMAdapter, LeadLookupAdapter } from '../adapters/crm/crm-adapter.interface';
import { PreCallScoringService } from './pre-call-scoring.service';

@Controller('leads')
export class LeadsController {
  constructor(
    @Inject(CRM_ADAPTER)
    private readonly crmAdapter: CRMAdapter,
    private readonly preCallScoringService: PreCallScoringService,
  ) {}

  @Post(':id/score')
  async scoreLead(@Param('id') id: string) {
    const leadLookup = this.crmAdapter as CRMAdapter & Partial<LeadLookupAdapter>;
    if (!leadLookup.getLeadById) {
      throw new BadRequestException('Configured CRM adapter does not support lead lookup by id');
    }

    try {
      const lead = await leadLookup.getLeadById(id);
      const customer = await this.crmAdapter.getCustomerById(lead.customerId);
      const score = this.preCallScoringService.scoreLead(lead, customer.language);

      return {
        conversionProbability: score.conversionProbability,
        modelVersion: score.modelVersion,
        computedAt: score.computedAt,
      };
    } catch (error) {
      throw new NotFoundException(error instanceof Error ? error.message : `Lead not found: ${id}`);
    }
  }

  @Get()
  async listLeads(
    @Query('funnelId') funnelId?: string,
    @Query('stageId') stageId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
  ) {
    if (!funnelId || !stageId) {
      throw new BadRequestException('funnelId and stageId are required query params for lead listing');
    }

    const leads = await this.crmAdapter.getLeadsByFunnelStage(funnelId, stageId);

    if (sortBy === 'conversionScore') {
      const languageByCustomerId = new Map<string, string>();
      for (const lead of leads) {
        if (!languageByCustomerId.has(lead.customerId)) {
          const customer = await this.crmAdapter.getCustomerById(lead.customerId);
          languageByCustomerId.set(lead.customerId, customer.language);
        }
      }

      const scored = this.preCallScoringService.scoreAndSort(leads, languageByCustomerId);
      if (order === 'asc') {
        scored.reverse();
      }

      return {
        leads: scored,
      };
    }

    return {
      leads,
    };
  }
}
