import { Customer } from '../../common/models/customer.model';
import { FunnelContext } from '../../common/models/funnel.model';
import { Lead, LeadStatus } from '../../common/models/lead.model';

export interface CRMAdapter {
  getCustomerById(id: string): Promise<Customer>;
  getLeadsByFunnelStage(funnelId: string, stageId: string): Promise<Lead[]>;
  updateLeadStatus(leadId: string, status: LeadStatus): Promise<void>;
  getCustomerFunnelContext(customerId: string, funnelId: string): Promise<FunnelContext>;
}

export interface LeadLookupAdapter {
  getLeadById(id: string): Promise<Lead>;
}