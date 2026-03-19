import { LLMConfig, LLMResponse } from '../types';
import { BaseService, LLMMessage } from './llm.base';

export class OllamaService implements BaseService {
  private baseUrl: string;
  private model: string;

  constructor(config: LLMConfig) {
    if (!config.baseUrl) {
      throw new Error('Ollama base URL is required');
    }

    this.baseUrl = config.baseUrl;
    this.model = config.model || 'llama2';
  }

  async chat(messages: LLMMessage[], systemPrompt: string): Promise<LLMResponse> {
    const allMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: allMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const content = data.message?.content || '';

    return {
      content,
      model: this.model,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embeddings error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return data.embedding || [];
  }
}
