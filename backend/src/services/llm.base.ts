import { LLMConfig, LLMProvider } from '../types';
import { OpenAIService } from './openai.service';
import { ClaudeService } from './claude.service';
import { OllamaService } from './ollama.service';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: number;
  model: string;
}

export interface BaseService {
  chat(messages: LLMMessage[], systemPrompt: string): Promise<LLMResponse>;
  generateEmbedding(text: string): Promise<number[]>;
}

/**
 * Factory function to create LLM service based on provider
 */
export function createLLMService(config: LLMConfig): BaseService {
  switch (config.provider) {
    case 'openai':
      return new OpenAIService(config);
    case 'claude':
      return new ClaudeService(config);
    case 'ollama':
      return new OllamaService(config);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}
