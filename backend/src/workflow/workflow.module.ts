import { Module } from '@nestjs/common';
import { ModuleRegistryModule } from '../common/registry/module-registry.module';
import { WorkflowController } from './workflow.controller';

@Module({
  imports: [ModuleRegistryModule],
  controllers: [WorkflowController],
})
export class WorkflowModule {}
