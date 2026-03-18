import { Module } from '@nestjs/common';
import { CRMAdapterModule } from '../../adapters/crm/crm-adapter.module';
import { CustomerContextAcquisitionService } from './customer-context-acquisition.service';

@Module({
  imports: [CRMAdapterModule],
  providers: [CustomerContextAcquisitionService],
  exports: [CustomerContextAcquisitionService],
})
export class CustomerContextAcquisitionModule {}