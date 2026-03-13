import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { AppConfigService } from '../common/config/app-config.service';
import { WorkflowModuleError } from '../common/errors/workflow-module.error';
import { ExecutionContext } from '../common/interfaces/execution-context.interface';
import { ModuleInput, ModuleOutput } from '../common/interfaces/module.types';
import { WorkflowModule } from '../common/interfaces/workflow-module.interface';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { CorrelationIdService } from '../common/logger/correlation-id.service';
import { ModuleRegistry } from '../common/registry/module-registry';

interface ExecuteModuleRequest {
  moduleId: string;
  input: ModuleInput;
  context?: {
    correlationId?: string;
    customerId?: string;
    funnelId?: string;
    stageId?: string;
  };
}

interface ExecuteModuleResponse {
  moduleId: string;
  output: ModuleOutput;
}

@Controller('workflow')
export class WorkflowController {
  private readonly logger: ReturnType<AppLoggerService['createLogger']>;

  constructor(
    private readonly moduleRegistry: ModuleRegistry,
    private readonly configService: AppConfigService,
    private readonly loggerFactory: AppLoggerService,
    private readonly correlationIdService: CorrelationIdService,
  ) {
    this.logger = this.loggerFactory.createLogger('workflow-api');
  }

  @Get('modules')
  getWorkflowModules(): { modules: Array<{ id: string; tags: string[] }> } {
    return { modules: this.moduleRegistry.list('workflow') };
  }

  @Post('execute')
  async executeModule(@Body() requestBody: unknown): Promise<ExecuteModuleResponse> {
    const payload = this.validateRequest(requestBody);

    if (!this.moduleRegistry.has(payload.moduleId)) {
      throw new NotFoundException(`Workflow module not found: ${payload.moduleId}`);
    }

    const workflowModule = this.moduleRegistry.get<WorkflowModule<ModuleInput, ModuleOutput>>(payload.moduleId);
    const executionContext = this.createExecutionContext(payload);

    try {
      const output = await workflowModule.execute(payload.input, executionContext);

      return {
        moduleId: payload.moduleId,
        output,
      };
    } catch (error) {
      if (error instanceof WorkflowModuleError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private validateRequest(requestBody: unknown): ExecuteModuleRequest {
    if (!isRecord(requestBody)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (typeof requestBody.moduleId !== 'string' || requestBody.moduleId.trim().length === 0) {
      throw new BadRequestException('moduleId is required');
    }

    if (!isRecord(requestBody.input)) {
      throw new BadRequestException('input must be an object');
    }

    if (requestBody.context !== undefined && !isRecord(requestBody.context)) {
      throw new BadRequestException('context must be an object when provided');
    }

    return {
      moduleId: requestBody.moduleId,
      input: requestBody.input,
      context: requestBody.context,
    };
  }

  private createExecutionContext(payload: ExecuteModuleRequest): ExecutionContext {
    const context = payload.context ?? {};

    return {
      correlationId: context.correlationId ?? this.correlationIdService.getCorrelationId() ?? crypto.randomUUID(),
      customerId: context.customerId ?? readString(payload.input.customerId) ?? '',
      funnelId: context.funnelId ?? readString(payload.input.funnelId) ?? '',
      stageId: context.stageId ?? 'phase-1-stage',
      config: this.configService.getConfig(),
      logger: this.logger,
      stepOutputs: new Map(),
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}
