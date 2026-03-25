import { v4 as uuidv4 } from 'uuid';
import { Domain, SearchResult } from '../types';

const INTENT_KEYWORDS: Record<Domain, Record<string, string[]>> = {
  fitness: {
    start_fitness: ['start', 'begin', 'beginner', 'new', 'starting', 'first time'],
    create_workout_plan: ['workout plan', 'routine', 'program', 'schedule', 'training plan'],
    cardio_training: ['cardio', 'running', 'endurance', 'stamina', 'aerobic', 'heart rate'],
    fat_loss_metabolism: ['fat loss', 'weight loss', 'metabolism', 'burn', 'calories', 'diet'],
    increase_energy: ['energy', 'tired', 'fatigue', 'boost', 'stamina', 'strength'],
    recovery_training: ['recovery', 'rest', 'recover', 'healing', 'cool down'],
    overtraining: ['overtraining', 'overuse', 'injury', 'burnout', 'too much'],
    breathing_techniques: ['breathing', 'breath', 'meditation', 'mindfulness', 'relaxation'],
    exercise_for_stress: ['stress', 'anxiety', 'mental health', 'mood', 'depression', 'wellness'],
    brain_health: ['brain', 'memory', 'cognition', 'focus', 'concentration', 'neuroplasticity'],
    fitness_motivation: ['motivation', 'motivate', 'inspired', 'consistent', 'discipline'],
    daily_activity: ['daily', 'activity', 'movement', 'active', 'sedentary', 'lifestyle'],
    exercise_science: ['science', 'mechanism', 'how does', 'physiology', 'biomechanics'],
    injury_prevention: ['injury', 'prevent', 'safety', 'form', 'technique', 'pain'],
    general_fitness: ['fitness', 'exercise', 'workout', 'training', 'health'],
  },
  plants: {
    plant_care: ['care', 'maintain', 'grow', 'watering', 'water', 'sunlight', 'light'],
    plant_selection: ['choose', 'best plant', 'recommend', 'which plant', 'suggest', 'what plant'],
    soil_fertilizer: ['soil', 'fertilizer', 'compost', 'nutrients', 'feed', 'potting mix'],
    pest_disease: ['pest', 'disease', 'bug', 'insect', 'fungus', 'rot', 'treatment', 'cure', 'dying'],
    pruning: ['prune', 'trim', 'cut', 'shape', 'deadhead', 'pinch'],
    repotting: ['repot', 'pot', 'container', 'transplant', 'roots bound', 'new pot'],
    indoor_plants: ['indoor', 'inside', 'home', 'room', 'low light', 'apartment', 'office'],
    outdoor_plants: ['outdoor', 'garden', 'yard', 'balcony', 'terrace', 'outside'],
    seeds_propagation: ['seeds', 'germinate', 'sow', 'propagate', 'cutting', 'grow from'],
    seasonal_care: ['season', 'winter', 'summer', 'monsoon', 'spring', 'autumn', 'rain'],
    general_plants: ['plant', 'garden', 'grow', 'leaf', 'flower', 'bloom', 'tree', 'shrub'],
  },
};

const DEFAULT_INTENT: Record<Domain, string> = {
  fitness: 'general_fitness',
  plants: 'general_plants',
};

/**
 * Intent Classification Service
 * Maps user queries to domain-specific intents
 */
export class IntentDetectionService {
  private intentKeywords: Record<string, string[]>;
  private defaultIntent: string;

  constructor(domain: Domain) {
    this.intentKeywords = INTENT_KEYWORDS[domain];
    this.defaultIntent = DEFAULT_INTENT[domain];
  }

  /**
   * Detect user intent from query
   */
  public detectIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    let topIntent = this.defaultIntent;
    let maxMatches = 0;

    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      const matches = keywords.filter((keyword) => lowerQuery.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        topIntent = intent;
      }
    }

    return topIntent;
  }

  /**
   * Get confidence score for detected intent
   */
  public getConfidence(query: string, intent: string): number {
    const keywords = this.intentKeywords[intent] || [];
    const lowerQuery = query.toLowerCase();
    const matches = keywords.filter((keyword) => lowerQuery.includes(keyword)).length;
    const confidence = Math.min(1.0, matches / Math.max(keywords.length, 1));
    return confidence;
  }
}

/**
 * Vector Search Service
 */
export class SearchService {
  /**
   * Mock hybrid search combining vector and keyword search
   * In production, this connects to PostgreSQL with pgvector
   */
  public async hybridSearch(
    _query: string,
    _embedding: number[],
    _limit: number = 5
  ): Promise<SearchResult[]> {
    // TODO: Implement actual vector search with PostgreSQL + pgvector
    return [];
  }

  /**
   * Mock keyword search
   */
  public async keywordSearch(_query: string, _limit: number = 5): Promise<SearchResult[]> {
    // TODO: Implement actual keyword search in PostgreSQL
    return [];
  }

  /**
   * Rerank search results by relevance
   */
  public rerankResults(results: SearchResult[], query: string): SearchResult[] {
    return results.sort((a, b) => b.score - a.score);
  }
}

/**
 * Embedding Service wrapper
 */
export class EmbeddingService {
  /**
   * Generate mock embedding for text
   */
  public generateMockEmbedding(_text: string): number[] {
    // Generate random 1536-dimensional vector (OpenAI embedding size)
    return Array(1536)
      .fill(0)
      .map(() => Math.random());
  }

  /**
   * Normalize embedding vector
   */
  public normalize(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / magnitude);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  public cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
