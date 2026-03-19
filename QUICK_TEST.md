# ⚡ QUICK TEST REFERENCE

## 🎯 What Can Be Tested NOW (Phase 1)

### ✅ INFRASTRUCTURE
- Docker services startup
- Service networking
- Health checks
- Container logs

### ✅ DATABASE  
- PostgreSQL initialization
- Schema creation (7 tables)
- pgvector extension
- Index creation

### ✅ BACKEND API
- Server startup on :3001
- Health endpoint (`/health`)
- Security headers (Helmet)
- CORS configuration
- Rate limiting middleware
- Config loading

### ✅ FRONTEND
- UI loads on :3000
- Chat interface renders
- Suggested questions display
- Component interactions
- Styling (TailwindCSS)
- Animations (Framer Motion)

### ✅ CONFIGURATION
- Environment variable loading
- LLM provider selection (openai/claude/ollama)
- Config validation
- TypeScript compilation

### ✅ SERVICES
- Redis connection
- Cache operations
- Database connectivity
- Port availability

---

## ❌ NOT YET WORKING

- Chat endpoint (returns placeholder)
- LLM responses (not integrated)
- Vector search (not implemented)
- Data ingestion (script not ready)
- Intent detection (logic incomplete)
- Actual conversations (no wiring)

---

## 🚀 INSTANT TEST (2 minutes)

```bash
# Start
cd fitness-chat-app && docker-compose up -d

# Wait
sleep 15

# Check status
docker-compose ps

# Test backend
curl http://localhost:3001/health

# Open frontend
open http://localhost:3000
```

---

## 🧪 5-MINUTE TESTS

```bash
# 1. Database Check
docker-compose exec postgres psql -U postgres -d fitness_chat -c "\dt"

# 2. Redis Check
docker-compose exec redis redis-cli ping

# 3. Backend Logs
docker-compose logs backend | grep "LLM Provider"

# 4. CORS Check
curl -i -H "Origin: http://localhost:3000" http://localhost:3001/health

# 5. Frontend Load
open http://localhost:3000
```

---

## 📊 TEST MATRIX

| Test | Command | Expected |
|------|---------|----------|
| Services | `docker-compose ps` | All UP |
| Database | `\dt` in psql | 7 tables |
| Health | `curl :3001/health` | 200 OK |
| Frontend | `open :3000` | Page loads |
| Redis | `redis-cli ping` | PONG |
| Config | `docker logs backend` | LLM Provider shown |

---

## 🔧 TROUBLESHOOT

```bash
# Port conflict?
lsof -i :3001
lsof -i :3000
lsof -i :5432

# Backend crashed?
docker-compose logs backend --tail=100

# Rebuild?
docker-compose down
docker-compose up -d --build

# Database issue?
docker-compose exec postgres psql -U postgres -d fitness_chat
```

---

## 📖 FULL TESTING GUIDE

See: `TESTING_GUIDE.md` for comprehensive procedures

---

**Status**: ✅ Ready to test infrastructure, UI, and config  
**Next**: Wire LLM integration in Phase 2
