import { Body, Controller, Get, NotFoundException, Param, Patch, Query } from '@nestjs/common';
import { SuggestionEngineService } from './suggestion-engine.service';
import { SuggestionStatus } from './suggestion.types';

@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionEngineService: SuggestionEngineService) {}

  @Get()
  list(
    @Query('funnelId') funnelId?: string,
    @Query('status') status?: SuggestionStatus,
  ) {
    this.suggestionEngineService.run();
    return {
      suggestions: this.suggestionEngineService.list({ funnelId, status }),
      pendingHighImpactCount: this.suggestionEngineService.pendingHighImpactCount(),
    };
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    try {
      return {
        suggestion: this.suggestionEngineService.accept(id),
      };
    } catch (error) {
      throw new NotFoundException(error instanceof Error ? error.message : `Suggestion not found: ${id}`);
    }
  }

  @Patch(':id/dismiss')
  dismiss(@Param('id') id: string, @Body() body?: { reason?: string }) {
    try {
      return {
        suggestion: this.suggestionEngineService.dismiss(id, body?.reason),
      };
    } catch (error) {
      throw new NotFoundException(error instanceof Error ? error.message : `Suggestion not found: ${id}`);
    }
  }
}
