import { Injectable } from '@nestjs/common';
import { Customer } from '../common/models/customer.model';
import { FunnelContext, Objection } from '../common/models/funnel.model';
import { Lead } from '../common/models/lead.model';
import { ConversationGoal } from '../modules/phase2.types';

@Injectable()
export class PromptBuilderService {
  buildSystemPrompt(
    customer: Customer,
    lead: Lead,
    funnelContext: FunnelContext,
    objections: Objection[],
    goals: ConversationGoal[],
  ): string {
    const objectionsBlock = objections.map((entry) => `- ${entry.title}: ${entry.description}`).join('\n');
    const goalsBlock = goals.map((entry) => `- ${entry.description}`).join('\n');

    return [
      'You are a recovery call assistant.',
      `Customer: ${customer.name}`,
      `Language: ${customer.language}`,
      `Funnel: ${lead.funnelId}`,
      `Stage: ${lead.stageId}`,
      `Current context stage: ${funnelContext.currentStageId}`,
      'Goals:',
      goalsBlock,
      'Anticipated objections:',
      objectionsBlock || '- none',
      'Always be polite, concise, and action oriented.',
    ].join('\n');
  }
}
