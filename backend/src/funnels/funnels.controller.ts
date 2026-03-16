import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Funnel } from '../common/models/funnel.model';
import { FunnelsService } from './funnels.service';

@Controller('funnels')
export class FunnelsController {
  constructor(private readonly funnelsService: FunnelsService) {}

  @Get()
  list() {
    return this.funnelsService.list();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: Partial<Funnel>) {
    return this.funnelsService.update(id, payload);
  }
}
