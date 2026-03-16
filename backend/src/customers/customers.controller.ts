import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list() {
    return {
      items: this.customersService.list(),
    };
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    const customer = this.customersService.getById(id);
    if (!customer) {
      throw new NotFoundException(`Customer not found: ${id}`);
    }

    return {
      customer,
    };
  }
}
