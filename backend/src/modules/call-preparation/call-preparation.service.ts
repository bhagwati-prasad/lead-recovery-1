import { Injectable } from '@nestjs/common';
import { WorkflowModuleError } from '../../common/errors/workflow-module.error';
import { ExecutionContext } from '../../common/interfaces/execution-context.interface';
import { ModuleInput, ModuleOutput, ValidationError } from '../../common/interfaces/module.types';
import { WorkflowModule } from '../../common/interfaces/workflow-module.interface';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Customer } from '../../common/models/customer.model';
import { FunnelContext } from '../../common/models/funnel.model';
import { Lead } from '../../common/models/lead.model';
import { ObjectionDatabaseService } from '../../services/objection-database.service';
import { PromptBuilderService } from '../../services/prompt-builder.service';
import { ConversationGoal, ConversationStrategy } from '../phase2.types';

export interface CallPreparationInput extends ModuleInput {
  customer: Customer;
  lead: Lead;
  funnelContext: FunnelContext;
}

export interface CallPreparationOutput extends ModuleOutput {
  conversationStrategy: ConversationStrategy;
}

@Injectable()
export class CallPreparationService implements WorkflowModule<CallPreparationInput, CallPreparationOutput> {
  readonly id = 'call-preparation';
  private readonly logger: ReturnType<AppLoggerService['createLogger']>;

  constructor(
    private readonly objectionDatabaseService: ObjectionDatabaseService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly loggerFactory: AppLoggerService,
  ) {
    this.logger = this.loggerFactory.createLogger(this.id);
  }

  async execute(input: CallPreparationInput, _context: ExecutionContext): Promise<CallPreparationOutput> {
    const validationErrors = this.validateInputs(input);
    if (validationErrors.length > 0) {
      throw new WorkflowModuleError(validationErrors[0].message, this.id);
    }

    const databaseObjections = await this.objectionDatabaseService.getForStage(input.lead.funnelId, input.lead.stageId);
    const anticipatedObjections = [
      ...input.funnelContext.anticipatedObjections,
      ...databaseObjections,
    ];

    const goals: ConversationGoal[] = [
      {
        id: 'confirm-interest',
        description: 'Confirm the customer is willing to continue the application flow.',
        completionSignal: 'customer expresses willingness to proceed',
        isMandatory: true,
      },
      {
        id: 'resolve-primary-objection',
        description: 'Address at least one primary objection for the current stage.',
        completionSignal: 'customer acknowledges resolution guidance',
        isMandatory: true,
      },
    ];

    const conversationStrategy: ConversationStrategy = {
      systemPrompt: this.promptBuilderService.buildSystemPrompt(
        input.customer,
        input.lead,
        input.funnelContext,
        anticipatedObjections,
        goals,
      ),
      anticipatedObjections,
      resolutionScripts: anticipatedObjections.map((entry) => ({
        objectionId: entry.id,
        script: entry.handlingScript ?? `Acknowledge concern: ${entry.title}`,
      })),
      agentPersona: {
        name: 'Asha',
        language: input.customer.language,
        tone: 'empathetic and concise',
        voiceId: 'mock-voice-1',
      },
      maxTurns: 5,
      goals,
    };

    this.logger.info('Prepared call conversation strategy', {
      leadId: input.lead.id,
      objectionCount: anticipatedObjections.length,
      maxTurns: conversationStrategy.maxTurns,
    });

    return { conversationStrategy };
  }

  validateInputs(input: CallPreparationInput): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!input.customer || typeof input.customer.id !== 'string') {
      errors.push({ field: 'customer', message: 'customer is required' });
    }
    if (!input.lead || typeof input.lead.id !== 'string') {
      errors.push({ field: 'lead', message: 'lead is required' });
    }
    if (!input.funnelContext || typeof input.funnelContext.currentStageId !== 'string') {
      errors.push({ field: 'funnelContext', message: 'funnelContext is required' });
    }
    return errors;
  }

  getDependencies(): string[] {
    return ['customer-data-retrieval', 'customer-context-acquisition'];
  }

  isFusable(_adjacentModuleId: string): boolean {
    return false;
  }

  canSkip(_context: ExecutionContext): boolean {
    return false;
  }
}
