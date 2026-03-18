import { ExecutionContext } from './execution-context.interface';
import { ModuleInput, ModuleOutput, ValidationError } from './module.types';

export interface WorkflowModule<I extends ModuleInput, O extends ModuleOutput> {
  readonly id: string;
  execute(input: I, context: ExecutionContext): Promise<O>;
  validateInputs(input: I): ValidationError[];
  getDependencies(): string[];
  isFusable(adjacentModuleId: string): boolean;
  canSkip(context: ExecutionContext): boolean;
}