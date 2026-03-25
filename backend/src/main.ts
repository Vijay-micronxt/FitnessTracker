import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { config, getLLMConfig } from './config/env';
import { createLLMService } from './services/llm.base';
import { BaseService, LLMMessage } from './services/llm.base';
import { DataService } from './services/data.service';
import { queueService } from './services/queue.service';
import { cacheService } from './services/cache.response.service';

const app = Fastify({
  logger: {
    level: config.logLevel,
  },
});

// Initialize LLM service
let llmService: BaseService | null = null;
try {
  app.log.info('[INIT] Initializing LLM service...');
  const llmConfig = getLLMConfig();
  app.log.info(`[INIT] LLM Config loaded: provider=${llmConfig.provider}`);
  llmService = createLLMService(llmConfig);
  app.log.info('[INIT] LLM service initialized successfully');
} catch (error: any) {
  app.log.error(`[INIT] Failed to initialize LLM: ${error.message}`);
  // Will handle gracefully in endpoint
}

// Initialize Data service (domain-scoped)
const dataService = new DataService(config.domain);
app.log.info(`[INIT] Loading data service for domain: ${config.domain}...`);
dataService.loadData().catch(err =>
  app.log.error(`[INIT] Failed to load data source: ${err.message}`)
);
app.log.info('[INIT] Data service loaded');

// Register middleware
const registerMiddleware = async () => {
  app.log.info('[INIT] Registering middleware...');
  await app.register(fastifyHelmet);
  app.log.info('[INIT] Helmet registered');
  await app.register(fastifyCors, { origin: config.corsOrigin });
  app.log.info(`[INIT] CORS registered (origin: ${config.corsOrigin})`);
  await app.register(fastifyRateLimit, {
    timeWindow: `${config.rateLimitWindowMs}ms`,
    max: config.rateLimitMaxRequests,
  });
  app.log.info('[INIT] Rate limit registered');
};

// Root endpoint
app.get('/', async () => {
  app.log.info('[ROOT] Health check');
  return {
    message: 'Chat API',
    version: '1.0.0',
    status: 'running',
    domain: config.domain,
    llmProvider: config.llmProvider,
    endpoints: {
      health: '/health',
      chat: '/api/chat'
    }
  };
});

// Health check endpoint
app.get('/health', async () => {
  app.log.info('[HEALTH] Check received');
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    features: {
      voiceInput: config.featureVoiceInput,
      voiceOutput: config.featureVoiceOutput,
      multilingual: config.featureMultilingual,
      supportedLanguages: config.supportedLanguages,
    }
  };
});

// Configuration endpoint - returns feature flags and settings
app.get('/config', async () => {
  app.log.info('[CONFIG] Configuration requested');
  return {
    features: {
      voiceInput: config.featureVoiceInput,
      voiceOutput: config.featureVoiceOutput,
      multilingual: config.featureMultilingual,
      supportedLanguages: config.supportedLanguages,
    },
    llmProvider: config.llmProvider,
  };
});

// Chat endpoint (with LLM integration and data retrieval)
app.post('/api/chat', async (request: any, reply) => {
  app.log.info('[CHAT API] Incoming request');
  try {
    const { message, language } = request.body;
    app.log.info(`[CHAT API] Message received: "${message.substring(0, 50)}..."`);
    
    if (!message || typeof message !== 'string') {
      app.log.warn('[CHAT API] Invalid message format');
      reply.code(400);
      return { error: 'Invalid request: message field is required' };
    }
    
    // Log detected language if provided by frontend
    if (language) {
      app.log.info(`[CHAT API] User language: ${language}`);
    }

    // Check cache first
    const cachedResponse = cacheService.get(message);
    if (cachedResponse) {
      app.log.info('[CHAT API] Cache hit - returning cached response');
      return cachedResponse;
    }

    // Process through queue to handle rate limiting
    const result = await queueService.enqueue(async () => {
      return await processChatMessage(message, llmService, dataService, app, 3, language);
    });

    // Cache the response
    cacheService.set(message, result.response, result.citedArticles);

    return result;
  } catch (error: any) {
    app.log.error(`[CHAT API] Unexpected error: ${error.message}`);
    reply.code(500);
    return { error: 'Internal server error', details: error.message };
  }
});

/**
 * Get language name from language code
 */
function getLanguageName(langCode?: string): string {
  if (!langCode) return 'English';
  
  const langMap: Record<string, string> = {
    'ta': 'Tamil',
    'ta-IN': 'Tamil',
    'te': 'Telugu',
    'te-IN': 'Telugu',
    'hi': 'Hindi',
    'hi-IN': 'Hindi',
    'kn': 'Kannada',
    'kn-IN': 'Kannada',
    'ml': 'Malayalam',
    'ml-IN': 'Malayalam',
    'bn': 'Bengali',
    'bn-IN': 'Bengali',
    'gu': 'Gujarati',
    'gu-IN': 'Gujarati',
    'mr': 'Marathi',
    'mr-IN': 'Marathi',
    'pa': 'Punjabi',
    'pa-IN': 'Punjabi',
  };
  
  return langMap[langCode] || 'English';
}

/**
 * Process chat message with exponential backoff for rate limit handling
 */
async function processChatMessage(
  message: string,
  llmService: BaseService | null,
  dataService: DataService,
  app: any,
  retries: number = 3,
  userLanguage?: string
): Promise<{ response: string; citedArticles: any[] }> {
  try {
    let response = '';
    let citedArticles: any[] = [];

    if (llmService) {
      try {
        app.log.info('[CHAT API] Starting article search...');
        // Search for relevant articles from data source
        const relevantArticles = dataService.searchArticles(message, 3);
        app.log.info(`[CHAT API] Found ${relevantArticles.length} relevant articles`);
        
        // Build context from relevant articles
        let contextInfo = '';
        if (relevantArticles.length > 0) {
          contextInfo = '\n\nRelevant articles to reference:\n\n';
          relevantArticles.forEach((article, idx) => {
            contextInfo += `[${idx + 1}] ${article.title}\n`;
            contextInfo += article.content.substring(0, 500) + '...\n';
            if (article.images && article.images.length > 0) {
              contextInfo += `Available images for this article:\n`;
              article.images.slice(0, 3).forEach((imgUrl, imgIdx) => {
                contextInfo += `  IMAGE_${idx + 1}_${imgIdx + 1}: ${imgUrl}\n`;
              });
            }
            contextInfo += '\n';
          });

          citedArticles = relevantArticles.map(article => ({
            title: article.title,
            category: article.category || 'Guide',
            url: article.url,
            images: article.images || [],
          }));
          app.log.info(`[CHAT API] Built context with ${citedArticles.length} citations and ${citedArticles.reduce((sum, a) => sum + (a.images?.length || 0), 0)} images`);
        }

        const domainSystemPrompts: Record<string, string> = {
          fitness: 'You are a fitness expert assistant. When answering questions, integrate the provided fitness information naturally into your response. Do not say "the knowledge base says" or "according to the articles". Instead, present the information as factual fitness guidance. Focus on practical, actionable advice based on exercise science principles.',
          plants: 'You are a plant care and gardening expert assistant. When answering questions, integrate the provided plant information naturally into your response. Do not say "the knowledge base says" or "according to the articles". Instead, present the information as factual plant care guidance. Focus on practical, actionable advice based on horticulture principles.',
        };
        const basePrompt = domainSystemPrompts[config.domain] ?? domainSystemPrompts.fitness;

        const systemPrompt = `${basePrompt}${userLanguage && userLanguage !== 'en' ? `\n\nCRITICAL LANGUAGE REQUIREMENT: You MUST respond ONLY and ENTIRELY in ${getLanguageName(userLanguage)} language.
- Use ONLY ${userLanguage} script throughout your entire response.
- Do NOT mix English words, Hindi, or any other language.
- Do NOT use Roman transliteration or English script.
- Every single word, number, punctuation must be in ${userLanguage} script.
- If you cannot express something in ${userLanguage}, reformulate it to use only ${userLanguage} words.
- Check your output carefully - it should contain ZERO English characters or non-${userLanguage} script characters.` : ''}${contextInfo}`;

        app.log.info('[CHAT API] Calling LLM service...');
        const userMessage: LLMMessage = { role: 'user', content: message };
        const llmResponse = await llmService.chat([userMessage], systemPrompt);
        response = llmResponse.content;
        app.log.info(`[CHAT API] LLM response received (${response.length} chars)`);

        // Inject images from the top-scoring article only
        const topImages = (relevantArticles[0]?.images || []).filter(Boolean);
        if (topImages.length > 0) {
          response = injectImagesIntoResponse(response, topImages);
        }
      } catch (llmError: any) {
        // Check if it's a rate limit error (429)
        if (llmError.status === 429 && retries > 0) {
          const delayMs = Math.pow(2, 3 - retries) * 1000; // 1s, 2s, 4s
          app.log.warn(`[CHAT API] Rate limited. Retrying in ${delayMs}ms (${retries} retries left)`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return processChatMessage(message, llmService, dataService, app, retries - 1);
        }
        
        app.log.error(`[CHAT API] LLM error: ${llmError.message}`);
        response = `I encountered an error processing your request: ${llmError.message}. Please try again.`;
      }
    } else {
      app.log.warn('[CHAT API] LLM service is not initialized');
      response = `I'm unable to process your request at the moment. The LLM service is not properly configured.`;
    }

    app.log.info('[CHAT API] Returning response');
    return { 
      response,
      citedArticles
    };
  } catch (error: any) {
    app.log.error(`[CHAT API] processChatMessage error: ${error.message}`);
    throw error;
  }
}

/**
 * Inject image markers into LLM response at natural breakpoints.
 * Places first image after the intro paragraph, second after the first section heading.
 */
function injectImagesIntoResponse(text: string, imageUrls: string[]): string {
  if (!imageUrls.length) return text;

  const lines = text.split('\n');
  const result: string[] = [];
  let imagesInserted = 0;
  const maxImages = Math.min(2, imageUrls.length);
  let introFlushed = false;
  let blanksSeen = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    result.push(line);

    // Insert first image after the first blank line (end of intro paragraph)
    if (!introFlushed && line.trim() === '') {
      blanksSeen++;
      if (blanksSeen === 1 && imagesInserted < maxImages) {
        result.push(`[IMAGE: ${imageUrls[imagesInserted++]}]`);
        result.push('');
        introFlushed = true;
      }
    }

    // Insert second image after the first section heading (## or ###)
    if (
      imagesInserted < maxImages &&
      introFlushed &&
      (line.startsWith('## ') || line.startsWith('### '))
    ) {
      result.push(`[IMAGE: ${imageUrls[imagesInserted++]}]`);
    }
  }

  return result.join('\n');
}

// Start server
const start = async () => {
  try {
    app.log.info('[START] Starting server initialization...');
    await registerMiddleware();
    app.log.info('[START] Middleware registered');
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`[START] Server listening at http://0.0.0.0:${config.port}`);
    app.log.info(`[START] Server running on http://localhost:${config.port}`);
    app.log.info(`[START] LLM Provider: ${config.llmProvider}`);
    app.log.info(`[START] Domain: ${config.domain}`);
    app.log.info('[START] Ready to accept requests!');
  } catch (err) {
    app.log.error(`[START] Fatal error: ${err}`);
    process.exit(1);
  }
};

start();
