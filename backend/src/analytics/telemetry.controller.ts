import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { EventBus } from './event-bus';

interface TelemetryPayload {
  type?: string;
  [key: string]: unknown;
}

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly eventBus: EventBus) {}

  @Post()
  ingest(@Body() payload: unknown) {
    if (!isRecord(payload)) {
      throw new BadRequestException('telemetry payload must be an object');
    }

    const body = payload as TelemetryPayload;
    this.eventBus.emit({
      type: 'telemetry.client',
      payload: {
        ...body,
        telemetryType: typeof body.type === 'string' ? body.type : 'unknown',
        receivedAt: new Date().toISOString(),
      },
    });

    return {
      ok: true,
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
