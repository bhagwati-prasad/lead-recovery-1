import { Module } from '@nestjs/common';
import { AppConfigModule } from './common/config/app-config.module';
import { LoggerModule } from './common/logger/logger.module';
import { ModuleRegistryModule } from './common/registry/module-registry.module';
import { HealthModule } from './health/health.module';
import { CRMAdapterModule } from './adapters/crm/crm-adapter.module';
import { CustomerDataRetrievalModule } from './modules/customer-data-retrieval/customer-data-retrieval.module';
import { CustomerContextAcquisitionModule } from './modules/customer-context-acquisition/customer-context-acquisition.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    CRMAdapterModule,
    ModuleRegistryModule,
    HealthModule,
    WorkflowModule,
    CustomerDataRetrievalModule,
    CustomerContextAcquisitionModule,
  ],
  exports: [ModuleRegistryModule, CRMAdapterModule],
})
export class AppModule {}