import { ResolvedConfig } from '../config/config.schema';
import { Logger } from '../logger/logger.interface';
import { ModuleOutput } from './module.types';

export interface ExecutionContext {
  correlationId: string;
  customerId: string;
  funnelId: string;
  stageId: string;
  config: ResolvedConfig;
  logger: Logger;
  stepOutputs: Map<string, ModuleOutput>;
}