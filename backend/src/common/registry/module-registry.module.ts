import { Module } from '@nestjs/common';
import { CustomerContextAcquisitionModule } from '../../modules/customer-context-acquisition/customer-context-acquisition.module';
import { CustomerContextAcquisitionService } from '../../modules/customer-context-acquisition/customer-context-acquisition.service';
import { CustomerDataRetrievalModule } from '../../modules/customer-data-retrieval/customer-data-retrieval.module';
import { CustomerDataRetrievalService } from '../../modules/customer-data-retrieval/customer-data-retrieval.service';
import { ModuleRegistry } from './module-registry';

@Module({
  imports: [CustomerDataRetrievalModule, CustomerContextAcquisitionModule],
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
  exports: [ModuleRegistry],
})
export class ModuleRegistryModule {}
