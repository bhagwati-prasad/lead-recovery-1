import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/app-config.service';
import { CorrelationIdService } from './common/logger/correlation-id.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix('api');

  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
  const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

  const isCodespacesOrigin = (origin: string): boolean => {
    try {
      const { protocol, hostname } = new URL(origin);
      if (protocol !== 'https:') {
        return false;
      }
      return hostname.endsWith('.app.github.dev') || hostname.endsWith('.githubpreview.dev');
    } catch {
      return false;
    }
  };

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.has(origin) || isCodespacesOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
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