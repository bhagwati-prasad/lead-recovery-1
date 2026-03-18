import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ObjectionsModule } from '../modules/objections/objections.module';
import { SuggestionEngineService } from './suggestion-engine.service';
import { SuggestionsController } from './suggestions.controller';

@Module({
  imports: [AnalyticsModule, ObjectionsModule],
  providers: [SuggestionEngineService],
  controllers: [SuggestionsController],
  exports: [SuggestionEngineService],
})
export class SuggestionsModule {}
