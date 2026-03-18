import { Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { AppConfigService } from '../common/config/app-config.service';

export interface IntegrationStatus {
  id: string;
  label: string;
  configured: boolean;
  activeProvider: boolean;
  message: string;
}

export interface IntegrationTestResult {
  ok: boolean;
  reason?: string;
  message: string;
}

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly configService: AppConfigService) {}

  @Get()
  list(): IntegrationStatus[] {
    const config = this.configService.getConfig();
    const telephonyProvider = config.telephony.provider;

    return [
      {
        id: 'sarvam-ai',
        label: 'Sarvam AI',
        configured: this.testSarvam().ok,
        activeProvider: config.stt.provider === 'sarvam',
        message: this.testSarvam().message,
      },
      {
        id: 'eleven-labs',
        label: 'Eleven Labs',
        configured: this.testElevenLabs().ok,
        activeProvider: config.tts.provider === 'elevenlabs',
        message: this.testElevenLabs().message,
      },
      {
        id: 'twilio',
        label: 'Twilio',
        configured: this.testTwilio().ok,
        activeProvider: telephonyProvider === 'twilio',
        message: this.testTwilio().message,
      },
      {
        id: 'exotel',
        label: 'Exotel',
        configured: this.testExotel().ok,
        activeProvider: telephonyProvider === 'exotel',
        message: this.testExotel().message,
      },
      {
        id: 'crm',
        label: 'CRM',
        configured: this.testCrm().ok,
        activeProvider: config.crm.adapter !== 'mock',
        message: this.testCrm().message,
      },
    ];
  }

  @Post(':id/test')
  test(@Param('id') id: string): IntegrationTestResult {
    switch (id) {
      case 'sarvam-ai':
        return this.testSarvam();
      case 'eleven-labs':
        return this.testElevenLabs();
      case 'twilio':
        return this.testTwilio();
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
    const key = process.env[cfg.apiKeyEnvVar];
    if (!key) {
      return {
        ok: false,
        reason: 'not_configured',
        message: `Not configured — set the ${cfg.apiKeyEnvVar} environment variable`,
      };
    }
    return { ok: true, message: 'API key is configured' };
  }

  private testElevenLabs(): IntegrationTestResult {
    const cfg = this.configService.getConfig().tts.elevenLabs;
    const key = process.env[cfg.apiKeyEnvVar];
    if (!key) {
      return {
        ok: false,
        reason: 'not_configured',
        message: `Not configured — set the ${cfg.apiKeyEnvVar} environment variable`,
      };
    }
    return { ok: true, message: 'API key is configured' };
  }

  private testTwilio(): IntegrationTestResult {
    const cfg = this.configService.getConfig().telephony.twilio;
    const sid = process.env[cfg.accountSidEnvVar];
    const token = process.env[cfg.authTokenEnvVar];
    if (!sid || !token) {
      const missing = [!sid && cfg.accountSidEnvVar, !token && cfg.authTokenEnvVar].filter(Boolean).join(', ');
      return {
        ok: false,
        reason: 'not_configured',
        message: `Not configured — set: ${missing}`,
      };
    }
    return { ok: true, message: 'Credentials are configured' };
  }

  private testExotel(): IntegrationTestResult {
    const cfg = this.configService.getConfig().telephony.exotel;
    const sid = process.env[cfg.accountSidEnvVar];
    const token = process.env[cfg.authTokenEnvVar];
    if (!sid || !token) {
      const missing = [!sid && cfg.accountSidEnvVar, !token && cfg.authTokenEnvVar].filter(Boolean).join(', ');
      return {
        ok: false,
        reason: 'not_configured',
        message: `Not configured — set: ${missing}`,
      };
    }
    return { ok: true, message: 'Credentials are configured' };
  }

  private testCrm(): IntegrationTestResult {
    const config = this.configService.getConfig().crm;
    if (config.adapter === 'mock') {
      return {
        ok: false,
        reason: 'not_configured',
        message: 'Using mock CRM — set crm.adapter in config to a real provider',
      };
    }
    return { ok: true, message: `Using ${config.adapter} CRM adapter` };
  }
}
