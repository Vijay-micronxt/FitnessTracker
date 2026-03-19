# Fitness Chat - Production-Ready Conversational Fitness Assistant

A full-stack application that allows users to ask fitness questions conversationally and receive answers generated from a fitness knowledge base using vector embeddings and LLM integration.

## 🏗️ Architecture

- **Backend**: Fastify + TypeScript with configurable LLM providers
- **Frontend**: Next.js 14 (App Router) with React + TailwindCSS + Framer Motion
- **Database**: PostgreSQL with pgvector for vector search
- **Cache**: Redis for query and response caching
- **Deployment**: Docker Compose for local development and production

## ✨ Features

- **Conversational AI**: Multi-turn conversations with context memory
- **Configurable LLM**: Support for OpenAI, Claude, or local Ollama
- **Vector Search**: Hybrid search combining vector embeddings and keyword matching
- **Intent Detection**: Automatic classification of user queries into 15 fitness intents
- **Smart Caching**: Redis-based caching for queries, embeddings, and responses
- **Rate Limiting**: 30 messages per hour per user
- **Modern UI**: Animated chat interface with typing indicators and suggested questions
- **Admin Panel**: Upload articles and reindex embeddings

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- LLM API Key (OpenAI, Claude, or local Ollama)

### Setup

1. **Clone and configure**:
   ```bash
   cd fitness-chat-app
   cp .env.example .env
   # Edit .env with your LLM provider and API key
   ```

2. **Start services**:
   ```bash
   docker-compose up -d
   ```

3. **Ingest data**:
   ```bash
   docker-compose exec backend npm run data:ingest
   ```

4. **Access**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

### Environment Configuration

#### LLM Providers

**Option 1: OpenAI**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4-turbo-preview
```

**Option 2: Claude (Anthropic)**
```bash
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-xxx
CLAUDE_MODEL=claude-3-sonnet-20240229
```

**Option 3: Ollama (Local)**
```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

## 📁 Project Structure

```
fitness-chat-app/
├── backend/
│   ├── src/
│   │   ├── api/           # Route handlers
│   │   ├── services/      # Business logic (search, embedding, intent)
│   │   ├── db/            # Database schema and migrations
│   │   ├── config/        # Environment and LLM configuration
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   └── main.ts        # Entry point
│   ├── .env.example       # Environment template
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── public/            # Static assets
│   ├── package.json
│   └── Dockerfile
├── scripts/               # Data ingestion and utilities
├── docker-compose.yml
└── README.md
```

## 🔧 Development

### Local Development (without Docker)

**Backend**:
```bash
cd backend
npm install
npm run dev
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
# Run migrations
docker-compose exec backend npm run db:migrate

# View schema
docker-compose exec postgres psql -U postgres -d fitness_chat -c "\dt"
```

### Data Ingestion

```bash
# Ingest articles from JSON
docker-compose exec backend npm run data:ingest

# Generates embeddings and stores in PostgreSQL
```

## 📊 Database Schema

### Key Tables

- `articles`: Fitness articles with metadata
- `article_chunks`: Article chunks with pgvector embeddings
- `tags`: Auto-generated tags for articles
- `conversations`: User conversation threads
- `messages`: Chat messages with intent and citations
- `query_cache`: Redis-backed query results cache

## 🤖 Supported Intents

1. start_fitness
2. create_workout_plan
3. cardio_training
4. fat_loss_metabolism
5. increase_energy
6. recovery_training
7. overtraining
8. breathing_techniques
9. exercise_for_stress
10. brain_health
11. fitness_motivation
12. daily_activity
13. exercise_science
14. injury_prevention
15. general_fitness

## ⚙️ Caching Strategy

- **Query Cache**: 10 minutes (frequently asked questions)
- **Embedding Cache**: 1 hour (vector search results)
- **Response Cache**: 24 hours (LLM responses)

## 🔒 Security

- API rate limiting (30 requests/hour)
- CORS configuration
- Input sanitization
- Helmet.js for headers
- JWT support (ready for implementation)

## 📈 Performance Targets

- Response time: < 2 seconds
- Vector search indexing with HNSW
- Server-side streaming for LLM responses
- Lazy-loaded UI components

## 📝 API Endpoints

### Chat

```bash
POST /api/chat
{
  "conversationId": "uuid",
  "message": "How do I start exercising?",
  "filters": {
    "category": "Training",
    "tags": ["beginner"]
  }
}
```

Response:
```json
{
  "conversationId": "uuid",
  "response": "To start exercising...",
  "citedArticles": [...],
  "intent": "start_fitness",
  "timestamp": "2024-03-14T..."
}
```

## 🚀 Deployment

### Docker Compose Production

```bash
# Build images
docker-compose -f docker-compose.yml build

# Run services
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### AWS/GCP Deployment

Services are containerized and ready for:
- Elastic Container Service (ECS)
- Google Cloud Run
- DigitalOcean App Platform
- Kubernetes

## 📚 Documentation

- [Backend API Docs](./backend/README.md) - In progress
- [Frontend Components](./frontend/README.md) - In progress
- [Data Ingestion Guide](./scripts/README.md) - In progress

## 🛣️ Roadmap

### Phase 1 (MVP) ✅
- Core chat system
- Vector search
- Intent detection
- Basic caching
- Chat UI

### Phase 2 (Advanced)
- Admin panel
- Conversation memory
- Advanced filtering
- Response streaming

### Phase 3 (Production)
- Analytics dashboard
- Voice input
- Monitoring & logging
- Load testing
- Multi-region deployment

## 📄 License

MIT

## 🤝 Contributing

See CONTRIBUTING.md for guidelines.
