import Ajv, { JSONSchemaType } from 'ajv';

export interface ResolvedConfig {
  app: {
    name: string;
    environment: string;
    port: number;
  };
  crm: {
    adapter: 'mock' | 'internal' | 'salesforce' | 'hubspot';
    baseUrl: string;
    timeout: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    format: 'json' | 'pretty';
    correlationIdHeader: string;
  };
  scheduling: {
    maxCallAttempts: number;
    retryIntervalMinutes: number;
  };
  security: {
    encryptionKeyEnvVar: string;
    jwtSecret: string;
  };
}

const schema: JSONSchemaType<ResolvedConfig> = {
  type: 'object',
  additionalProperties: false,
  required: ['app', 'crm', 'logging', 'scheduling', 'security'],
  properties: {
    app: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'environment', 'port'],
      properties: {
        name: { type: 'string' },
        environment: { type: 'string' },
        port: { type: 'integer' },
      },
    },
    crm: {
      type: 'object',
      additionalProperties: false,
      required: ['adapter', 'baseUrl', 'timeout'],
      properties: {
        adapter: { type: 'string', enum: ['mock', 'internal', 'salesforce', 'hubspot'] },
        baseUrl: { type: 'string' },
        timeout: { type: 'integer' },
      },
    },
    logging: {
      type: 'object',
      additionalProperties: false,
      required: ['level', 'format', 'correlationIdHeader'],
      properties: {
        level: { type: 'string', enum: ['debug', 'info', 'warn', 'error', 'fatal'] },
        format: { type: 'string', enum: ['json', 'pretty'] },
        correlationIdHeader: { type: 'string' },
      },
    },
    scheduling: {
      type: 'object',
      additionalProperties: false,
      required: ['maxCallAttempts', 'retryIntervalMinutes'],
      properties: {
        maxCallAttempts: { type: 'integer' },
        retryIntervalMinutes: { type: 'integer' },
      },
    },
    security: {
      type: 'object',
      additionalProperties: false,
      required: ['encryptionKeyEnvVar', 'jwtSecret'],
      properties: {
        encryptionKeyEnvVar: { type: 'string' },
        jwtSecret: { type: 'string' },
      },
    },
  },
};

const ajv = new Ajv({ allErrors: true });
const validator = ajv.compile(schema);

export function validateResolvedConfig(config: unknown): ResolvedConfig {
  if (validator(config)) {
    return config;
  }

  const errors = validator.errors?.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ');
  throw new Error(`Invalid application config: ${errors ?? 'unknown error'}`);
}