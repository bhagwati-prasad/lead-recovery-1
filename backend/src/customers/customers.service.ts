import { Injectable } from '@nestjs/common';
import { mockCustomers, mockLeads } from '../adapters/crm/mock-crm.data';

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  status: 'hot' | 'warm' | 'cold';
  score: number;
}

@Injectable()
export class CustomersService {
  list(): CustomerListItem[] {
    const leadByCustomer = new Map(mockLeads.map((lead) => [lead.customerId, lead]));

    return mockCustomers.map((customer) => {
      const lead = leadByCustomer.get(customer.id);
      const score = this.scoreFromLead(lead?.status);
      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        status: this.statusFromScore(score),
        score,
      };
    });
  }

  getById(id: string): CustomerListItem | undefined {
    return this.list().find((customer) => customer.id === id);
  }

  private scoreFromLead(status: string | undefined): number {
    switch (status) {
      case 'scheduled':
        return 0.82;
      case 'in-call':
        return 0.7;
      case 'pending':
        return 0.48;
      case 'recovered':
        return 0.9;
      case 'failed':
      case 'unreachable':
        return 0.22;
      case 'escalated':
        return 0.4;
      default:
        return 0.35;
    }
  }

  private statusFromScore(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= 0.75) {
      return 'hot';
    }
    if (score >= 0.45) {
      return 'warm';
    }
    return 'cold';
  }
}
