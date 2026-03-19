import { OpenAI } from 'openai';
import { LLMConfig, LLMResponse } from '../types';
import { BaseService, LLMMessage } from './llm.base';

export class OpenAIService implements BaseService {
  private client: OpenAI;
  private model: string;

  constructor(config: LLMConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gpt-4-turbo-preview';
  }

  async chat(messages: LLMMessage[], systemPrompt: string): Promise<LLMResponse> {
    const allMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: allMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '';

    return {
      content,
      tokensUsed: response.usage?.total_tokens,
      model: this.model,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0]?.embedding || [];
  }
}
