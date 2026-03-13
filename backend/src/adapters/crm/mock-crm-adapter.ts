import { Injectable } from '@nestjs/common';
import { CRMAdapter, LeadLookupAdapter } from './crm-adapter.interface';
import { Customer } from '../../common/models/customer.model';
import { FunnelContext } from '../../common/models/funnel.model';
import { Lead, LeadStatus } from '../../common/models/lead.model';
import { mockCustomers, mockFunnelContexts, mockLeads } from './mock-crm.data';

@Injectable()
export class MockCRMAdapter implements CRMAdapter, LeadLookupAdapter {
  private readonly customers = structuredClone(mockCustomers);
  private readonly leads = structuredClone(mockLeads);
  private readonly funnelContexts = structuredClone(mockFunnelContexts);

  async getCustomerById(id: string): Promise<Customer> {
    const customer = this.customers.find((entry) => entry.id === id);
    if (!customer) {
      throw new Error(`Customer not found: ${id}`);
    }
    return structuredClone(customer);
  }

  async getLeadById(id: string): Promise<Lead> {
    const lead = this.leads.find((entry) => entry.id === id);
    if (!lead) {
      throw new Error(`Lead not found: ${id}`);
    }
    return structuredClone(lead);
  }

  async getLeadsByFunnelStage(funnelId: string, stageId: string): Promise<Lead[]> {
    return structuredClone(this.leads.filter((lead) => lead.funnelId === funnelId && lead.stageId === stageId));
  }

  async updateLeadStatus(leadId: string, status: LeadStatus): Promise<void> {
    const lead = this.leads.find((entry) => entry.id === leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    lead.status = status;
  }

  async getCustomerFunnelContext(customerId: string, funnelId: string): Promise<FunnelContext> {
    const context = this.funnelContexts.find(
      (entry) => entry.customerId === customerId && entry.funnelId === funnelId,
    );
    if (!context) {
      throw new Error(`Funnel context not found for customer ${customerId} and funnel ${funnelId}`);
    }
    return structuredClone(context);
  }
}