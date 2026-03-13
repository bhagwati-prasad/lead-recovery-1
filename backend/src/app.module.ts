import { Module } from '@nestjs/common';
import { AppConfigModule } from './common/config/app-config.module';
import { LoggerModule } from './common/logger/logger.module';
import { ModuleRegistry } from './common/registry/module-registry';
import { HealthModule } from './health/health.module';
import { CRMAdapterModule } from './adapters/crm/crm-adapter.module';
import { CustomerDataRetrievalModule } from './modules/customer-data-retrieval/customer-data-retrieval.module';
import { CustomerDataRetrievalService } from './modules/customer-data-retrieval/customer-data-retrieval.service';
import { CustomerContextAcquisitionModule } from './modules/customer-context-acquisition/customer-context-acquisition.module';
import { CustomerContextAcquisitionService } from './modules/customer-context-acquisition/customer-context-acquisition.service';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    CRMAdapterModule,
    HealthModule,
    CustomerDataRetrievalModule,
    CustomerContextAcquisitionModule,
  ],
  providers: [
    {
      provide: ModuleRegistry,
      inject: [CustomerDataRetrievalService, CustomerContextAcquisitionService],
      useFactory: (
        customerDataRetrievalService: CustomerDataRetrievalService,
        customerContextAcquisitionService: CustomerContextAcquisitionService,
      ) => {
        const registry = new ModuleRegistry();
        registry.register(customerDataRetrievalService.id, customerDataRetrievalService, ['workflow']);
        registry.register(customerContextAcquisitionService.id, customerContextAcquisitionService, ['workflow']);
        return registry;
      },
    },
  ],
  exports: [ModuleRegistry, CRMAdapterModule],
})
export class AppModule {}