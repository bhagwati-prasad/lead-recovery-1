import { Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { PendingObjectionQueueService } from '../../services/pending-objection-queue.service';

@Controller('objections/pending')
export class ObjectionsController {
  constructor(private readonly pendingObjectionQueueService: PendingObjectionQueueService) {}

  @Get()
  listPending() {
    return {
      pending: this.pendingObjectionQueueService.list(),
    };
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    try {
      return {
        pending: this.pendingObjectionQueueService.approve(id),
      };
    } catch (error) {
      throw new NotFoundException(error instanceof Error ? error.message : 'Pending objection not found');
    }
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    try {
      return {
        pending: this.pendingObjectionQueueService.reject(id),
      };
    } catch (error) {
      throw new NotFoundException(error instanceof Error ? error.message : 'Pending objection not found');
    }
  }
}