import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CRM_ADAPTER } from '../adapters/crm/crm.tokens';
import { CRMAdapter } from '../adapters/crm/crm-adapter.interface';
import { EventBus } from '../analytics/event-bus';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { Objection } from '../common/models/funnel.model';

export interface DeviationSignal {
  type: string;
  confidence: number;
  evidenceTurns: number[];
}

export interface EscalationTicket {
  id: string;
  leadId: string;
  callSessionId: string;
  reason: string;
  deviationSignals: DeviationSignal[];
  transcriptSummary: string;
  topObjections: Objection[];
  assignedTo?: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: Date;
}

@Injectable()
export class EscalationService {
  private readonly logger: ReturnType<AppLoggerService['createLogger']>;
  private readonly tickets = new Map<string, EscalationTicket>();

  constructor(
    @Inject(CRM_ADAPTER) private readonly crmAdapter: CRMAdapter,
    private readonly eventBus: EventBus,
    private readonly loggerFactory: AppLoggerService,
  ) {
    this.logger = this.loggerFactory.createLogger('escalation-service');
  }

  async escalate(input: {
    leadId: string;
    callSessionId: string;
    reason: string;
    deviationSignals: DeviationSignal[];
    transcript: string[];
    topObjections: Objection[];
  }): Promise<EscalationTicket> {
    await this.crmAdapter.updateLeadStatus(input.leadId, 'escalated');

    const ticket: EscalationTicket = {
      id: `esc_${randomUUID()}`,
      leadId: input.leadId,
      callSessionId: input.callSessionId,
      reason: input.reason,
      deviationSignals: input.deviationSignals,
      transcriptSummary: this.summarizeTranscript(input.transcript),
      topObjections: input.topObjections,
      status: 'open',
      createdAt: new Date(),
    };
    this.tickets.set(ticket.id, ticket);

    this.eventBus.emit({
      type: 'lead.escalated',
      payload: {
        leadId: ticket.leadId,
        callSessionId: ticket.callSessionId,
        ticketId: ticket.id,
        reason: ticket.reason,
      },
    });

    this.logger.warn('Escalation ticket created', {
      ticketId: ticket.id,
      leadId: ticket.leadId,
      reason: ticket.reason,
    });

    return structuredClone(ticket);
  }

  list(): EscalationTicket[] {
    return [...this.tickets.values()].map((entry) => structuredClone(entry));
  }

  resolve(id: string): EscalationTicket {
    const ticket = this.tickets.get(id);
    if (!ticket) {
      throw new Error(`Escalation ticket not found: ${id}`);
    }
    ticket.status = 'resolved';
    return structuredClone(ticket);
  }

  private summarizeTranscript(entries: string[]): string {
    if (entries.length === 0) {
      return 'No transcript was available for escalation.';
    }

    const first = entries[0];
    const middle = entries[Math.floor(entries.length / 2)] ?? first;
    const last = entries[entries.length - 1] ?? middle;
    return `${first}. ${middle}. ${last}.`;
  }
}