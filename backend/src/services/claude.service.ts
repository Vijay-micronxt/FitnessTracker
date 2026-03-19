import { LLMConfig, LLMResponse } from '../types';
import { BaseService, LLMMessage } from './llm.base';

export class ClaudeService implements BaseService {
  private apiKey: string;
  private model: string;

  constructor(config: LLMConfig) {
    if (!config.apiKey) {
      throw new Error('Claude API key is required');
    }

    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-3-sonnet-20240229';
  }

  async chat(messages: LLMMessage[], systemPrompt: string): Promise<LLMResponse> {
    // Extract system message and user messages
    const userMessages = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1000,
        system: systemPrompt,
        messages: userMessages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const content = data.content[0]?.text || '';

    return {
      content,
      tokensUsed: data.usage?.output_tokens,
      model: this.model,
    };
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    // Claude doesn't have native embeddings API
    // This would require using a separate embedding service
    throw new Error('Claude does not provide embeddings. Use OpenAI for embeddings.');
  }
}
