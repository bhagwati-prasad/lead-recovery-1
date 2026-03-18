import { Module } from '@nestjs/common';
import { FunnelsController } from './funnels.controller';
import { FunnelsService } from './funnels.service';

@Module({
  controllers: [FunnelsController],
  providers: [FunnelsService],
})
export class FunnelsModule {}
