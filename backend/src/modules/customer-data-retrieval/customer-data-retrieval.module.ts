import { Module } from '@nestjs/common';
import { CRMAdapterModule } from '../../adapters/crm/crm-adapter.module';
import { CustomerDataRetrievalService } from './customer-data-retrieval.service';

@Module({
  imports: [CRMAdapterModule],
  providers: [CustomerDataRetrievalService],
  exports: [CustomerDataRetrievalService],
})
export class CustomerDataRetrievalModule {}