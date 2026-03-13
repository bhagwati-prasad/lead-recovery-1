import { Module } from '@nestjs/common';
import { CRM_ADAPTER } from './crm.tokens';
import { MockCRMAdapter } from './mock-crm-adapter';

@Module({
  providers: [
    {
      provide: CRM_ADAPTER,
      useClass: MockCRMAdapter,
    },
  ],
  exports: [CRM_ADAPTER],
})
export class CRMAdapterModule {}
