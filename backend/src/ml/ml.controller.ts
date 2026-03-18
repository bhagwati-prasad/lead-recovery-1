import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { MlLifecycleService, TrainingTrigger } from './ml-lifecycle.service';

@Controller('ml')
export class MlController {
  constructor(private readonly mlLifecycleService: MlLifecycleService) {}

  @Post('train')
  train(@Body() body?: { trigger?: TrainingTrigger }) {
    const trigger = body?.trigger ?? 'manual';
    if (!['manual', 'weekly', 'threshold'].includes(trigger)) {
      throw new BadRequestException('trigger must be one of manual|weekly|threshold');
    }

    return this.mlLifecycleService.train(trigger);
  }

  @Post('rollback')
  rollback() {
    try {
      return this.mlLifecycleService.rollback();
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Model rollback failed');
    }
  }

  @Get('history')
  history() {
    return {
      history: this.mlLifecycleService.getHistory(),
    };
  }

  @Get('current')
  current() {
    return this.mlLifecycleService.getCurrent();
  }
}
