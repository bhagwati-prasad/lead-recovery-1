import { Module } from '@nestjs/common';
import { ObjectionDatabaseService } from '../../services/objection-database.service';
import { PromptBuilderService } from '../../services/prompt-builder.service';
import { CallPreparationService } from './call-preparation.service';

@Module({
  providers: [CallPreparationService, ObjectionDatabaseService, PromptBuilderService],
  exports: [CallPreparationService],
})
export class CallPreparationModule {}
