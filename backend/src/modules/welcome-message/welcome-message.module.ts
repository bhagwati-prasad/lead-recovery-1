import { Module } from '@nestjs/common';
import { IntegrationAdaptersModule } from '../../adapters/integration-adapters.module';
import { WelcomeMessageService } from './welcome-message.service';

@Module({
  imports: [IntegrationAdaptersModule],
  providers: [WelcomeMessageService],
  exports: [WelcomeMessageService],
})
export class WelcomeMessageModule {}
