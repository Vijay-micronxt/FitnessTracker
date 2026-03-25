import dotenv from 'dotenv';
import { Domain, LLMProvider, LLMConfig } from '../types';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/fitness_chat',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // LLM Configuration
  llmProvider: (process.env.LLM_PROVIDER || 'openai') as LLMProvider,
  
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',

  // Claude
  claudeApiKey: process.env.CLAUDE_API_KEY,
  claudeModel: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',

  // Ollama
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama2',

  // Embedding
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  embeddingProvider: (process.env.EMBEDDING_PROVIDER || 'openai') as LLMProvider,

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10),

  // Caching
  cacheTtlQuery: parseInt(process.env.CACHE_TTL_QUERY || '600', 10),
  cacheTtlEmbedding: parseInt(process.env.CACHE_TTL_EMBEDDING || '3600', 10),
  cacheTtlResponse: parseInt(process.env.CACHE_TTL_RESPONSE || '86400', 10),

  // Domain
  domain: (process.env.DOMAIN || 'fitness') as Domain,

  // Application
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Feature Flags - Voice & Multilingual Support
  featureVoiceInput: process.env.FEATURE_VOICE_INPUT === 'true',
  featureVoiceOutput: process.env.FEATURE_VOICE_OUTPUT === 'true',
  featureMultilingual: process.env.FEATURE_MULTILINGUAL !== 'false',
  supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,es,fr,hi,ta,te').split(',').map(l => l.trim()),
};

/**
 * Get LLM Configuration based on provider
 */
export function getLLMConfig(): LLMConfig {
  const provider = config.llmProvider;

  switch (provider) {
    case 'openai':
      if (!config.openaiApiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required when using OpenAI provider');
      }
      return {
        provider: 'openai',
        model: config.openaiModel,
        apiKey: config.openaiApiKey,
      };

    case 'claude':
      if (!config.claudeApiKey) {
        throw new Error('CLAUDE_API_KEY environment variable is required when using Claude provider');
      }
      return {
        provider: 'claude',
        model: config.claudeModel,
        apiKey: config.claudeApiKey,
      };

    case 'ollama':
      return {
        provider: 'ollama',
        model: config.ollamaModel,
        baseUrl: config.ollamaBaseUrl,
      };

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Get Embedding Configuration
 */
export function getEmbeddingConfig(): LLMConfig {
  const provider = config.embeddingProvider;

  switch (provider) {
    case 'openai':
      if (!config.openaiApiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required for embeddings');
      }
      return {
        provider: 'openai',
        model: config.embeddingModel,
        apiKey: config.openaiApiKey,
      };

    default:
      throw new Error(`Unsupported embedding provider: ${provider}`);
  }
}
