import { Controller, Get, NotFoundException, Param, Patch } from '@nestjs/common';
import { EscalationService } from '../../services/escalation.service';

@Controller('escalations')
export class EscalationController {
  constructor(private readonly escalationService: EscalationService) {}

  @Get()
  listEscalations() {
    return {
      escalations: this.escalationService.list(),
    };
  }

  @Patch(':id/resolve')
  resolveEscalation(@Param('id') id: string) {
    try {
      return {
        escalation: this.escalationService.resolve(id),
      };
    } catch (error) {
      throw new NotFoundException(error instanceof Error ? error.message : 'Escalation ticket not found');
    }
  }
}