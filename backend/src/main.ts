import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { config, getLLMConfig } from './config/env';
import { createLLMService } from './services/llm.base';
import { BaseService, LLMMessage } from './services/llm.base';
import { DataService } from './services/data.service';

const app = Fastify({
  logger: {
    level: config.logLevel,
  },
});

// Initialize LLM service
let llmService: BaseService | null = null;
try {
  const llmConfig = getLLMConfig();
  llmService = createLLMService(llmConfig);
} catch (error: any) {
  // Will handle gracefully in endpoint
}

// Initialize Data service
const dataService = new DataService();
dataService.loadData().catch(err => 
  app.log.error('Failed to load data source:', err)
);

// Register middleware
const registerMiddleware = async () => {
  await app.register(fastifyHelmet);
  await app.register(fastifyCors, { origin: config.corsOrigin });
  await app.register(fastifyRateLimit, {
    timeWindow: `${config.rateLimitWindowMs}ms`,
    max: config.rateLimitMaxRequests,
  });
};

// Root endpoint
app.get('/', async () => {
  return { 
    message: 'Fitness Chat API', 
    version: '1.0.0',
    status: 'running',
    llmProvider: config.llmProvider,
    endpoints: {
      health: '/health',
      chat: '/api/chat'
    }
  };
});

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Chat endpoint (with LLM integration and data retrieval)
app.post('/api/chat', async (request: any, reply) => {
  try {
    const { message } = request.body;
    
    if (!message || typeof message !== 'string') {
      reply.code(400);
      return { error: 'Invalid request: message field is required' };
    }

    let response = '';
    let citedArticles: any[] = [];

    if (llmService) {
      try {
        // Search for relevant articles from data source
        const relevantArticles = dataService.searchArticles(message, 3);
        
        // Build context from relevant articles
        let contextInfo = '';
        if (relevantArticles.length > 0) {
          contextInfo = '\n\nRelevant fitness articles and guides to reference:\n\n';
          relevantArticles.forEach((article, idx) => {
            contextInfo += `[${idx + 1}] ${article.title}\n`;
            // Include first 500 chars of content as context
            contextInfo += article.content.substring(0, 500) + '...\n\n';
          });
          
          citedArticles = relevantArticles.map(article => ({
            title: article.title,
            category: article.category || 'Fitness Guide',
            url: article.url,
          }));
        }

        // Create system prompt with context - ask Claude to integrate naturally
        const systemPrompt = `You are a fitness expert assistant. When answering questions, integrate the provided fitness information naturally into your response. Do not say "the knowledge base says" or "according to the articles". Instead, present the information as factual fitness guidance. Focus on practical, actionable advice based on exercise science principles.${contextInfo}`;


        const userMessage: LLMMessage = { role: 'user', content: message };
        const llmResponse = await llmService.chat(
          [userMessage],
          systemPrompt
        );
        response = llmResponse.content;
      } catch (llmError: any) {
        app.log.error(`LLM error: ${llmError.message}`);
        response = `I encountered an error processing your request: ${llmError.message}. Please try again.`;
      }
    } else {
      response = `I'm unable to process your request at the moment. The LLM service is not properly configured.`;
    }

    return { 
      response,
      citedArticles
    };
  } catch (error: any) {
    reply.code(500);
    return { error: 'Internal server error', details: error.message };
  }
});

// Start server
const start = async () => {
  try {
    await registerMiddleware();
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${config.port}`);
    app.log.info(`LLM Provider: ${config.llmProvider}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
