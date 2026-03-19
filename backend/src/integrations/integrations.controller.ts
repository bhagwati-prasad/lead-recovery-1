import { Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import twilio from 'twilio';
import { AppConfigService } from '../common/config/app-config.service';

export interface IntegrationStatus {
  id: string;
  label: string;
  configured: boolean;
  activeProvider: boolean;
  message: string;
  checks?: IntegrationCheck[];
}

export interface IntegrationTestResult {
  ok: boolean;
  reason?: string;
  message: string;
  checks?: IntegrationCheck[];
}

export interface IntegrationCheck {
  id: string;
  title: string;
  ok: boolean;
  message: string;
}

const DEFAULT_ENV_VARS = {
  sarvamApiKey: 'SARVAM_API_KEY',
  elevenLabsApiKey: 'ELEVEN_LABS_API_KEY',
  twilioAccountSid: 'TWILIO_ACCOUNT_SID',
  twilioAuthToken: 'TWILIO_AUTH_TOKEN',
  exotelAccountSid: 'EXOTEL_ACCOUNT_SID',
  exotelAuthToken: 'EXOTEL_AUTH_TOKEN',
} as const;

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly configService: AppConfigService) {}

  @Get()
  async list(): Promise<IntegrationStatus[]> {
    const config = this.configService.getConfig();
    const telephonyProvider = config.telephony.provider;
    const sarvam = this.testSarvam();
    const elevenLabs = this.testElevenLabs();
    const twilio = await this.testTwilio(true);
    const exotel = this.testExotel();
    const crm = this.testCrm();

    return [
      {
        id: 'sarvam-ai',
        label: 'Sarvam AI',
        configured: sarvam.ok,
        activeProvider: config.stt.provider === 'sarvam',
        message: sarvam.message,
        checks: sarvam.checks,
      },
      {
        id: 'eleven-labs',
        label: 'Eleven Labs',
        configured: elevenLabs.ok,
        activeProvider: config.tts.provider === 'elevenlabs',
        message: elevenLabs.message,
        checks: elevenLabs.checks,
      },
      {
        id: 'twilio',
        label: 'Twilio',
        configured: twilio.ok,
        activeProvider: telephonyProvider === 'twilio',
        message: twilio.message,
        checks: twilio.checks,
      },
      {
        id: 'exotel',
        label: 'Exotel',
        configured: exotel.ok,
        activeProvider: telephonyProvider === 'exotel',
        message: exotel.message,
        checks: exotel.checks,
      },
      {
        id: 'crm',
        label: 'CRM',
        configured: crm.ok,
        activeProvider: config.crm.adapter !== 'mock',
        message: crm.message,
        checks: crm.checks,
      },
    ];
  }

  @Post(':id/test')
  async test(@Param('id') id: string): Promise<IntegrationTestResult> {
    return this.runTest(id);
  }

  @Get(':id/test')
  async testGet(@Param('id') id: string): Promise<IntegrationTestResult> {
    return this.runTest(id);
  }

  private async runTest(id: string): Promise<IntegrationTestResult> {
    switch (id) {
      case 'sarvam-ai':
        return this.testSarvam();
      case 'eleven-labs':
        return this.testElevenLabs();
      case 'twilio':
        return this.testTwilio(true);
      case 'exotel':
        return this.testExotel();
      case 'crm':
        return this.testCrm();
      default:
        throw new NotFoundException(`Unknown integration: ${id}`);
    }
  }

  private testSarvam(): IntegrationTestResult {
    const cfg = this.configService.getConfig().stt.sarvam;
    const key = this.resolveSecret(cfg.apiKeyEnvVar, DEFAULT_ENV_VARS.sarvamApiKey);
    if (!key) {
      return {
        ok: false,
        reason: 'not_configured',
        message: `Not configured — set ${DEFAULT_ENV_VARS.sarvamApiKey}`,
      };
    }
    return {
      ok: true,
      message: 'API key is configured',
      checks: [{ id: 'credentials', title: 'Credentials present', ok: true, message: 'API key is configured' }],
    };
  }

  private testElevenLabs(): IntegrationTestResult {
    const cfg = this.configService.getConfig().tts.elevenLabs;
    const key = this.resolveSecret(cfg.apiKeyEnvVar, DEFAULT_ENV_VARS.elevenLabsApiKey);
    if (!key) {
      return {
        ok: false,
        reason: 'not_configured',
        message: `Not configured — set ${DEFAULT_ENV_VARS.elevenLabsApiKey}`,
      };
    }
    return {
      ok: true,
      message: 'API key is configured',
      checks: [{ id: 'credentials', title: 'Credentials present', ok: true, message: 'API key is configured' }],
    };
  }

  private async testTwilio(includeLiveCheck = false): Promise<IntegrationTestResult> {
    const cfg = this.configService.getConfig().telephony.twilio;
    const sid = this.resolveSecret(cfg.accountSidEnvVar, DEFAULT_ENV_VARS.twilioAccountSid);
    const token = this.resolveSecret(cfg.authTokenEnvVar, DEFAULT_ENV_VARS.twilioAuthToken);

    const checks: IntegrationCheck[] = [];

    if (!sid || !token) {
      const missing = [
        !sid && DEFAULT_ENV_VARS.twilioAccountSid,
        !token && DEFAULT_ENV_VARS.twilioAuthToken,
      ].filter(Boolean).join(', ');

      checks.push({
        id: 'credentials',
        title: 'Credentials present',
        ok: false,
        message: `Missing required variables: ${missing}`,
      });

      if (includeLiveCheck) {
        checks.push({
          id: 'client',
          title: 'Twilio client auth check',
          ok: false,
          message: 'Skipped because credentials are missing',
        });
      }

      return {
        ok: false,
        reason: 'not_configured',
        message: `Not configured — set: ${missing}`,
        checks,
      };
    }

    checks.push({
      id: 'credentials',
      title: 'Credentials present',
      ok: true,
      message: 'Account SID and Auth Token are present',
    });

    if (!includeLiveCheck) {
      return { ok: true, message: 'Credentials are configured', checks };
    }

    const clientCheck = await this.verifyTwilioAuth(sid, token);
    checks.push(clientCheck);

    if (!clientCheck.ok) {
      return {
        ok: false,
        reason: 'auth_failed',
        message: clientCheck.message,
        checks,
      };
    }

    return {
      ok: true,
      message: 'Twilio credentials validated successfully',
      checks,
    };
  }

  private testExotel(): IntegrationTestResult {
    const cfg = this.configService.getConfig().telephony.exotel;
    const sid = this.resolveSecret(cfg.accountSidEnvVar, DEFAULT_ENV_VARS.exotelAccountSid);
    const token = this.resolveSecret(cfg.authTokenEnvVar, DEFAULT_ENV_VARS.exotelAuthToken);
    if (!sid || !token) {
      const missing = [
        !sid && DEFAULT_ENV_VARS.exotelAccountSid,
        !token && DEFAULT_ENV_VARS.exotelAuthToken,
      ].filter(Boolean).join(', ');
      return {
        ok: false,
        reason: 'not_configured',
        message: `Not configured — set: ${missing}`,
      };
    }
    return {
      ok: true,
      message: 'Credentials are configured',
      checks: [{ id: 'credentials', title: 'Credentials present', ok: true, message: 'Credentials are configured' }],
    };
  }

  private testCrm(): IntegrationTestResult {
    const config = this.configService.getConfig().crm;
    if (config.adapter === 'mock') {
      return {
        ok: false,
        reason: 'not_configured',
        message: 'Using mock CRM — set crm.adapter in config to a real provider',
        checks: [{ id: 'credentials', title: 'Adapter configured', ok: false, message: 'Adapter is mock' }],
      };
    }
    return {
      ok: true,
      message: `Using ${config.adapter} CRM adapter`,
      checks: [{ id: 'credentials', title: 'Adapter configured', ok: true, message: `Using ${config.adapter} adapter` }],
    };
  }

  private async verifyTwilioAuth(accountSid: string, authToken: string): Promise<IntegrationCheck> {
    let client: ReturnType<typeof twilio>;

    try {
      client = twilio(accountSid, authToken);
    } catch {
      return {
        id: 'client',
        title: 'Twilio client auth check',
        ok: false,
        message: 'Failed to create Twilio SDK client',
      };
    }

    try {
      const accountList = await client.api.v2010.accounts.list({ limit: 20 });

      return {
        id: 'client',
        title: 'Twilio client auth check',
        ok: true,
        message: 'Twilio SDK client created and authenticated',
      };
    } catch {
      return {
        id: 'client',
        title: 'Twilio client auth check',
        ok: false,
        message: 'Twilio SDK auth check failed',
      };
    }
  }

  private resolveSecret(configEntry: string | undefined, fallbackEnvName: string): string | undefined {
    if (typeof configEntry === 'string' && configEntry.length > 0) {
      if (this.looksLikeEnvVarName(configEntry)) {
        return process.env[configEntry] ?? process.env[fallbackEnvName];
      }
      // Backward compatibility: some environments stored raw credentials in config.
      return configEntry;
    }

    return process.env[fallbackEnvName];
  }

  private looksLikeEnvVarName(value: string): boolean {
    return /^[A-Z_][A-Z0-9_]*$/.test(value);
  }
}
