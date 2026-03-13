import { Global, Module } from '@nestjs/common';
import { LocalAudioCache } from './audio-cache/local-audio-cache';
import { MockLLMAdapter } from './llm/mock-llm-adapter';
import { MockSTTAdapter } from './stt/mock-stt-adapter';
import { MockTelephonyAdapter } from './telephony/mock-telephony-adapter';
import { MockTTSAdapter } from './tts/mock-tts-adapter';

@Global()
@Module({
  providers: [LocalAudioCache, MockSTTAdapter, MockTTSAdapter, MockLLMAdapter, MockTelephonyAdapter],
  exports: [LocalAudioCache, MockSTTAdapter, MockTTSAdapter, MockLLMAdapter, MockTelephonyAdapter],
})
export class IntegrationAdaptersModule {}
