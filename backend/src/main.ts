import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/app-config.service';
import { CorrelationIdService } from './common/logger/correlation-id.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$|^https:\/\/.*\.(app\.github\.dev|githubpreview\.dev)$/,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    credentials: true,
  });

  const configService = app.get(AppConfigService);
  const correlationIdService = app.get(CorrelationIdService);

  app.use((request: { headers: Record<string, string | string[] | undefined> }, response: unknown, next: () => void) => {
    const headerName = configService.getConfig().logging.correlationIdHeader.toLowerCase();
    const headerValue = request.headers[headerName];
    const correlationId = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue ?? crypto.randomUUID();

    correlationIdService.run(correlationId, next);
  });

  await app.listen(configService.getConfig().app.port);
}

void bootstrap();