import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { ResolvedConfig, validateResolvedConfig } from './config.schema';

type PlainObject = Record<string, unknown>;

@Injectable()
export class AppConfigService {
  private readonly config: ResolvedConfig;

  constructor() {
    this.config = this.load();
  }

  getConfig(): ResolvedConfig {
    return this.config;
  }

  private load(): ResolvedConfig {
    const defaultConfig = this.loadYaml('default.yaml');
    const environmentName = process.env.NODE_ENV;
    const environmentConfig = environmentName ? this.loadYaml(`${environmentName}.yaml`, false) : {};
    const envOverrides = this.loadEnvOverrides();
    return validateResolvedConfig(this.deepMerge(defaultConfig, environmentConfig, envOverrides));
  }

  private loadYaml(fileName: string, required = true): PlainObject {
    const configPath = join(process.cwd(), 'config', fileName);
    if (!existsSync(configPath)) {
      if (required) {
        throw new Error(`Missing config file: ${configPath}`);
      }
      return {};
    }

    const content = readFileSync(configPath, 'utf8');
    return (yaml.load(content) as PlainObject | undefined) ?? {};
  }

  private loadEnvOverrides(): PlainObject {
    const overrides: PlainObject = {};

    if (process.env.APP_PORT !== undefined) {
      overrides.app = { port: Number(process.env.APP_PORT) };
    }

    if (process.env.LOG_LEVEL !== undefined) {
      overrides.logging = { ...(overrides.logging as PlainObject | undefined), level: process.env.LOG_LEVEL };
    }

    if (process.env.JWT_SECRET !== undefined) {
      overrides.security = { ...(overrides.security as PlainObject | undefined), jwtSecret: process.env.JWT_SECRET };
    }

    return overrides;
  }

  private deepMerge(...objects: PlainObject[]): PlainObject {
    return objects.reduce<PlainObject>((accumulator, current) => {
      for (const [key, value] of Object.entries(current)) {
        if (this.isPlainObject(value) && this.isPlainObject(accumulator[key])) {
          accumulator[key] = this.deepMerge(accumulator[key] as PlainObject, value);
        } else {
          accumulator[key] = value;
        }
      }
      return accumulator;
    }, {});
  }

  private isPlainObject(value: unknown): value is PlainObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}