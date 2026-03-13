import { ResolvedConfig } from 'src/common/config/config.schema';
import { ExecutionContext } from 'src/common/interfaces/execution-context.interface';
import { Logger } from 'src/common/logger/logger.interface';

export const testConfig: ResolvedConfig = {
  app: {
    name: 'lead-recovery',
    environment: 'test',
    port: 3001,
  },
  crm: {
    adapter: 'mock',
    baseUrl: '',
    timeout: 100,
  },
  logging: {
    level: 'debug',
    format: 'json',
    correlationIdHeader: 'X-Correlation-ID',
  },
  scheduling: {
    maxCallAttempts: 3,
    retryIntervalMinutes: 60,
  },
  security: {
    encryptionKeyEnvVar: 'ENCRYPTION_KEY',
    jwtSecret: '',
  },
};

export const silentLogger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  fatal: () => undefined,
};

export function buildExecutionContext(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    correlationId: 'corr_test_001',
    customerId: 'cust_001',
    funnelId: 'funnel_bob_credit_card',
    stageId: 'stage_mobile_verification',
    config: testConfig,
    logger: silentLogger,
    stepOutputs: new Map(),
    ...overrides,
  };
}
