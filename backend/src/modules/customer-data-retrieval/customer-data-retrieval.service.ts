import { Inject, Injectable } from '@nestjs/common';
import { CRM_ADAPTER } from '../../adapters/crm/crm.tokens';
import { CRMAdapter, LeadLookupAdapter } from '../../adapters/crm/crm-adapter.interface';
import { AppConfigService } from '../../common/config/app-config.service';
import { WorkflowModuleError } from '../../common/errors/workflow-module.error';
import { ExecutionContext } from '../../common/interfaces/execution-context.interface';
import { ModuleInput, ModuleOutput, ValidationError } from '../../common/interfaces/module.types';
import { WorkflowModule } from '../../common/interfaces/workflow-module.interface';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Customer } from '../../common/models/customer.model';
import { Lead } from '../../common/models/lead.model';

export interface CustomerDataRetrievalInput extends ModuleInput {
  leadId: string;
}

export interface CustomerDataRetrievalOutput extends ModuleOutput {
  customer: Customer;
  lead: Lead;
}

@Injectable()
export class CustomerDataRetrievalService
  implements WorkflowModule<CustomerDataRetrievalInput, CustomerDataRetrievalOutput>
{
  readonly id = 'customer-data-retrieval';
  private readonly logger: ReturnType<AppLoggerService['createLogger']>;

  constructor(
    @Inject(CRM_ADAPTER)
    private readonly crmAdapter: CRMAdapter & LeadLookupAdapter,
    private readonly loggerFactory: AppLoggerService,
    private readonly configService: AppConfigService,
  ) {
    this.logger = this.loggerFactory.createLogger(this.id);
  }

  async execute(
    input: CustomerDataRetrievalInput,
    _context: ExecutionContext,
  ): Promise<CustomerDataRetrievalOutput> {
    const validationErrors = this.validateInputs(input);
    if (validationErrors.length > 0) {
      throw new WorkflowModuleError(validationErrors[0].message, this.id);
    }

    const lead = await this.crmAdapter.getLeadById(input.leadId);
    if (lead.status !== 'scheduled') {
      throw new WorkflowModuleError(`Lead ${input.leadId} is not scheduled`, this.id);
    }

    const customer = await this.crmAdapter.getCustomerById(lead.customerId);
    this.logger.info('Customer data retrieved', {
      customerId: customer.id,
      leadId: lead.id,
      crmAdapter: this.configService.getConfig().crm.adapter,
    });

    return { customer, lead };
  }

  validateInputs(input: CustomerDataRetrievalInput): ValidationError[] {
    if (typeof input.leadId !== 'string' || input.leadId.trim().length === 0) {
      return [{ field: 'leadId', message: 'leadId is required' }];
    }
    return [];
  }

  getDependencies(): string[] {
    return ['crm-adapter'];
  }

  isFusable(adjacentModuleId: string): boolean {
    return adjacentModuleId === 'customer-context-acquisition';
  }

  canSkip(_context: ExecutionContext): boolean {
    return false;
  }
}