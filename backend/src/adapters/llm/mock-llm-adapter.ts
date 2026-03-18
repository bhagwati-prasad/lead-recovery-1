import { Injectable } from '@nestjs/common';
import { LLMAdapter, LLMRequest, LLMResponse } from './llm-adapter.interface';

@Injectable()
export class MockLLMAdapter implements LLMAdapter {
  async complete(req: LLMRequest): Promise<LLMResponse> {
    const lastUserMessage = [...req.messages].reverse().find((message) => message.role === 'user')?.content ?? '';
    const lower = lastUserMessage.toLowerCase();

    let content = 'I can help you complete your application now. Shall we continue?';
    if (lower.includes('not interested') || lower.includes('stop')) {
      content = 'Understood. I will mark this as declined. Thank you for your time.';
    } else if (lower.includes('otp')) {
      content = 'I can help resend the OTP and guide you through verification right now.';
    } else if (lower.includes('yes')) {
      content = 'Great. We are all set to complete the pending step now.';
    }

    return {
      content,
      finishReason: 'stop',
      promptTokens: Math.min(800, JSON.stringify(req.messages).length),
      completionTokens: Math.min(200, content.length),
    };
  }
}
