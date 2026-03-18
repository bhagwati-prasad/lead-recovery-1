import { Module } from '@nestjs/common';
import { PendingObjectionQueueService } from '../../services/pending-objection-queue.service';
import { ObjectionsController } from './objections.controller';

@Module({
  providers: [PendingObjectionQueueService],
  controllers: [ObjectionsController],
  exports: [PendingObjectionQueueService],
})
export class ObjectionsModule {}