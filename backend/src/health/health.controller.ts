import { Controller, Get } from '@nestjs/common';
import { AppConfigService } from '../common/config/app-config.service';

@Controller('health')
export class HealthController {
  constructor(private readonly configService: AppConfigService) {}

  @Get()
  getHealth(): { status: string; version: string; uptime: number; environment: string } {
    return {
      status: 'ok',
      version: process.env.npm_package_version ?? '0.1.0',
      uptime: Math.floor(process.uptime()),
      environment: this.configService.getConfig().app.environment,
    };
  }
}