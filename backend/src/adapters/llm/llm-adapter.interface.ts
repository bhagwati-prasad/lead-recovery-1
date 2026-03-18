export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  maxTokens: number;
  temperature: number;
  stopSequences?: string[];
}

export interface LLMResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter';
  promptTokens: number;
  completionTokens: number;
}

export interface LLMAdapter {
  complete(req: LLMRequest): Promise<LLMResponse>;
}
