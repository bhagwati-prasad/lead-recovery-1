import { Inject, Injectable } from '@nestjs/common';
import { CRM_ADAPTER } from '../../adapters/crm/crm.tokens';
import { CRMAdapter } from '../../adapters/crm/crm-adapter.interface';
import { WorkflowModuleError } from '../../common/errors/workflow-module.error';
import { ExecutionContext } from '../../common/interfaces/execution-context.interface';
import { ModuleInput, ModuleOutput, ValidationError } from '../../common/interfaces/module.types';
import { WorkflowModule } from '../../common/interfaces/workflow-module.interface';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { FunnelContext } from '../../common/models/funnel.model';

export interface CustomerContextAcquisitionInput extends ModuleInput {
  customerId: string;
  funnelId: string;
}

export interface CustomerContextAcquisitionOutput extends ModuleOutput {
  funnelContext: FunnelContext;
}

@Injectable()
export class CustomerContextAcquisitionService
  implements WorkflowModule<CustomerContextAcquisitionInput, CustomerContextAcquisitionOutput>
{
  readonly id = 'customer-context-acquisition';
  private readonly logger: ReturnType<AppLoggerService['createLogger']>;

  constructor(
    @Inject(CRM_ADAPTER) private readonly crmAdapter: CRMAdapter,
    private readonly loggerFactory: AppLoggerService,
  ) {
    this.logger = this.loggerFactory.createLogger(this.id);
  }

  async execute(
    input: CustomerContextAcquisitionInput,
    _context: ExecutionContext,
  ): Promise<CustomerContextAcquisitionOutput> {
    const validationErrors = this.validateInputs(input);
    if (validationErrors.length > 0) {
      throw new WorkflowModuleError(validationErrors[0].message, this.id);
    }

    const funnelContext = await this.crmAdapter.getCustomerFunnelContext(input.customerId, input.funnelId);
    if (funnelContext.anticipatedObjections.length === 0) {
      throw new WorkflowModuleError('No anticipated objections found for funnel context', this.id);
    }

    this.logger.info('Customer funnel context acquired', {
      customerId: input.customerId,
      funnelId: input.funnelId,
      currentStageId: funnelContext.currentStageId,
    });

    return { funnelContext };
  }

  validateInputs(input: CustomerContextAcquisitionInput): ValidationError[] {
    const errors: ValidationError[] = [];
    if (typeof input.customerId !== 'string' || input.customerId.trim().length === 0) {
      errors.push({ field: 'customerId', message: 'customerId is required' });
    }
    if (typeof input.funnelId !== 'string' || input.funnelId.trim().length === 0) {
      errors.push({ field: 'funnelId', message: 'funnelId is required' });
    }
    return errors;
  }

  getDependencies(): string[] {
    return ['crm-adapter'];
  }

  isFusable(adjacentModuleId: string): boolean {
    return adjacentModuleId === 'customer-data-retrieval';
  }

  canSkip(_context: ExecutionContext): boolean {
    return false;
  }
}