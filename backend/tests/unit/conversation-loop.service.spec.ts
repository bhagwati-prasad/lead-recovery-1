import { AppConfigService } from 'src/common/config/app-config.service';
import { AppLoggerService } from 'src/common/logger/app-logger.service';
import { CorrelationIdService } from 'src/common/logger/correlation-id.service';
import { MockLLMAdapter } from 'src/adapters/llm/mock-llm-adapter';
import { MockSTTAdapter } from 'src/adapters/stt/mock-stt-adapter';
import { MockTelephonyAdapter } from 'src/adapters/telephony/mock-telephony-adapter';
import { MockTTSAdapter } from 'src/adapters/tts/mock-tts-adapter';
import { LocalAudioCache } from 'src/adapters/audio-cache/local-audio-cache';
import { ConversationLoopService } from 'src/modules/conversation-loop/conversation-loop.service';
import { ResponseProcessingService } from 'src/modules/response-processing/response-processing.service';
import { IntentClassifierService } from 'src/services/intent-classifier.service';
import { AssessmentService } from 'src/services/assessment.service';
import { buildExecutionContext, testConfig } from './test-helpers';

describe('ConversationLoopService', () => {
  const configService = { getConfig: () => testConfig } as AppConfigService;
  const loggerFactory = new AppLoggerService(configService, new CorrelationIdService());

  it('reaches goal-achieved in scripted happy path', async () => {
    const telephonyAdapter = new MockTelephonyAdapter();
    const initiation = await telephonyAdapter.initiateCall({
      fromNumber: '+910000000000',
      toNumber: '+919900000001',
      callbackUrl: 'http://localhost',
      metadata: {},
    });

    const responseProcessing = new ResponseProcessingService(
      new MockSTTAdapter(),
      new MockLLMAdapter(),
      new MockTTSAdapter(),
      telephonyAdapter,
      new LocalAudioCache(),
      new IntentClassifierService(),
      loggerFactory,
    );

    const service = new ConversationLoopService(
      responseProcessing,
      new AssessmentService(),
      loggerFactory,
    );

    const result = await service.execute(
      {
        providerCallId: initiation.providerCallId,
        callSessionId: 'session_test_001',
        conversationStrategy: {
          systemPrompt: 'Be helpful',
          anticipatedObjections: [],
          resolutionScripts: [],
          agentPersona: {
            name: 'Asha',
            language: 'en-IN',
            tone: 'calm',
            voiceId: 'mock-voice-1',
          },
          maxTurns: 5,
          goals: [
            {
              id: 'g1',
              description: 'Get consent',
              completionSignal: 'customer agrees',
              isMandatory: true,
            },
          ],
        },
        initialTranscript: [
          {
            timestamp: new Date(),
            speaker: 'agent',
            text: 'Welcome',
          },
        ],
        scriptedCustomerUtterances: ['yes, continue'],
      },
      buildExecutionContext(),
    );

    expect(result.endReason).toBe('goal-achieved');
    expect(result.turnCount).toBe(1);
    expect(result.assessment.score).toBeGreaterThanOrEqual(0.7);
  });
});
