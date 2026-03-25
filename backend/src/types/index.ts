// Domain Types
export type Domain = 'fitness' | 'plants';

// LLM Provider Types
export type LLMProvider = 'openai' | 'claude' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: number;
  model: string;
}

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Article and Chunk Types
export interface ArticleChunk {
  id: string;
  articleId: string;
  title: string;
  content: string;
  category: string;
  subcategory: string;
  tags: string[];
  embeddingVector: number[];
  sourceUrl?: string;
  createdAt: Date;
}

export interface SearchResult {
  chunkId: string;
  articleId: string;
  title: string;
  content: string;
  score: number;
  category: string;
  tags: string[];
}

// Intent Types
export type FitnessIntent =
  | 'start_fitness'
  | 'create_workout_plan'
  | 'cardio_training'
  | 'fat_loss_metabolism'
  | 'increase_energy'
  | 'recovery_training'
  | 'overtraining'
  | 'breathing_techniques'
  | 'exercise_for_stress'
  | 'brain_health'
  | 'fitness_motivation'
  | 'daily_activity'
  | 'exercise_science'
  | 'injury_prevention'
  | 'general_fitness';

export type PlantsIntent =
  | 'plant_care'
  | 'plant_selection'
  | 'soil_fertilizer'
  | 'pest_disease'
  | 'pruning'
  | 'repotting'
  | 'indoor_plants'
  | 'outdoor_plants'
  | 'seeds_propagation'
  | 'seasonal_care'
  | 'general_plants';

export type UserIntent = FitnessIntent | PlantsIntent;

export interface IntentResult {
  intent: UserIntent;
  confidence: number;
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citedChunks?: string[];
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
  filters?: {
    category?: string;
    tags?: string[];
  };
}

export interface ChatResponse {
  conversationId: string;
  response: string;
  citedArticles: SearchResult[];
  intent: UserIntent;
  timestamp: Date;
}

// Cache Types
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
