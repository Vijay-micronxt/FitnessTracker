# 🧪 TESTING GUIDE - Phase 1 Scaffolding

**What Can Be Tested Right Now**

---

## ✅ WHAT'S TESTABLE NOW

### 1. **Docker Services Startup** ✅
All infrastructure is ready to test:
- PostgreSQL with pgvector
- Redis cache
- Backend API (Fastify)
- Frontend (Next.js)

### 2. **Database Schema** ✅
- PostgreSQL initialization
- Schema auto-creation
- Table structure validation

### 3. **Backend Health Endpoint** ✅
- Server startup
- Configuration loading
- Middleware initialization (CORS, Helmet, Rate Limit)

### 4. **Environment Configuration** ✅
- LLM provider selection
- Config validation
- Environment variable loading

### 5. **Frontend UI** ✅
- Page loads at localhost:3000
- Chat interface renders
- Suggested questions display
- Component interactions (buttons, input)

### 6. **Configuration System** ✅
- Verify LLM provider selection
- Check environment variable loading
- Validate config object

---

## 🚀 TESTING PROCEDURES

### **Test 1: Docker Services Startup**

```bash
# Navigate to project
cd /Users/vijay/Documents/fitnessPOS/fitness-chat-app

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# Expected output:
# NAME                  STATUS
# fitness-postgres      Up (healthy)
# fitness-redis         Up (healthy)
# fitness-backend       Up
# fitness-frontend      Up
```

**What this tests:**
✅ Docker Compose configuration  
✅ Service networking  
✅ Health checks  
✅ Volume mounting  

---

### **Test 2: Database Schema Initialization**

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d fitness_chat -c "\dt"

# Expected output:
#              List of relations
#  Schema |       Name       | Type  |  Owner
# --------+------------------+-------+----------
#  public | articles         | table | postgres
#  public | article_chunks   | table | postgres
#  public | article_tags     | table | postgres
#  public | tags             | table | postgres
#  public | conversations    | table | postgres
#  public | messages         | table | postgres
#  public | query_cache      | table | postgres

# Verify schema details
docker-compose exec postgres psql -U postgres -d fitness_chat -c "\d articles"

# Verify pgvector extension
docker-compose exec postgres psql -U postgres -d fitness_chat -c "SELECT * FROM pg_extension WHERE extname='vector';"
```

**What this tests:**
✅ Database initialization  
✅ Schema creation  
✅ pgvector extension installation  
✅ Table structure  
✅ Indexes  

---

### **Test 3: Backend Health Endpoint**

```bash
# Wait for backend to be ready (about 10 seconds)
sleep 10

# Test health endpoint
curl -s http://localhost:3001/health | jq .

# Expected output:
# {
#   "status": "ok",
#   "timestamp": "2024-03-14T10:30:45.123Z"
# }

# Check response headers
curl -i http://localhost:3001/health

# Expected: Should include security headers (Helmet.js)
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - Content-Security-Policy: ...
```

**What this tests:**
✅ Backend server startup  
✅ Fastify initialization  
✅ Middleware registration (Helmet, CORS, Rate Limit)  
✅ Configuration loading  
✅ Request/response handling  

---

### **Test 4: Backend Logs & LLM Provider**

```bash
# View backend logs
docker-compose logs backend

# Look for these lines in output:
# Server running on http://localhost:3001
# LLM Provider: openai (or claude/ollama depending on .env)

# View specific backend output
docker-compose logs -f backend | head -20

# To see ongoing logs in real-time
docker-compose logs -f backend
```

**What this tests:**
✅ Application startup messages  
✅ LLM provider configuration loaded  
✅ Environment variables read correctly  
✅ Server ready status  

---

### **Test 5: Frontend Application**

```bash
# Open browser
open http://localhost:3000

# Expected to see:
# ✓ Fitness Assistant header
# ✓ Welcome message with emoji (💪)
# ✓ "Get personalized answers..." subtitle
# ✓ 6 suggested question cards
# ✓ Chat input box at bottom
# ✓ "Send" button
# ✓ Dark theme styling

# Test interactions:
# 1. Hover over suggested questions - should show hover effect
# 2. Click a suggested question - input field should populate
# 3. Type in input box - text should appear
# 4. Click Send - should show loading state (dots bouncing)
```

**What this tests:**
✅ Next.js application startup  
✅ React component rendering  
✅ TailwindCSS styling  
✅ Framer Motion animations  
✅ User interactions  
✅ Browser compatibility  

---

### **Test 6: CORS Configuration**

```bash
# Test CORS from frontend origin
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3001/api/chat -v

# Expected response headers:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
# Access-Control-Allow-Headers: Content-Type
```

**What this tests:**
✅ CORS middleware working  
✅ Origin validation  
✅ Preflight requests  
✅ Cross-origin communication  

---

### **Test 7: Rate Limiting Middleware**

```bash
# Make multiple requests rapidly to test rate limit
for i in {1..5}; do
  echo "Request $i:"
  curl -s http://localhost:3001/health | jq '.status'
done

# With rate limit, after max requests in window:
# Expected: 429 Too Many Requests (if limit is hit)
```

**What this tests:**
✅ Rate limiting middleware  
✅ Request throttling  
✅ Configuration application  

---

### **Test 8: Redis Connection**

```bash
# Check Redis is running
docker-compose exec redis redis-cli ping

# Expected output:
# PONG

# Verify Redis info
docker-compose exec redis redis-cli info server

# Test cache set/get (manual test of cache service)
docker-compose exec redis redis-cli SET test-key "test-value"
docker-compose exec redis redis-cli GET test-key

# Expected: "test-value"
```

**What this tests:**
✅ Redis service running  
✅ Redis connectivity  
✅ Basic cache operations  

---

### **Test 9: Configuration Loading**

```bash
# Check if .env file exists
ls -la /Users/vijay/Documents/fitnessPOS/fitness-chat-app/.env

# View backend logs to confirm config loaded
docker-compose logs backend | grep -i "LLM Provider"

# Expected to see:
# LLM Provider: openai (or claude/ollama)

# Test with different LLM provider
# 1. Edit .env:
#    LLM_PROVIDER=claude
# 2. Restart backend:
docker-compose restart backend
# 3. Check logs again - should show:
#    LLM Provider: claude
```

**What this tests:**
✅ Environment variable loading  
✅ Configuration validation  
✅ LLM provider selection  
✅ Config system working  

---

### **Test 10: TypeScript Compilation**

```bash
# Build backend
cd /Users/vijay/Documents/fitnessPOS/fitness-chat-app/backend
npm run build

# Expected: No TypeScript errors
# Should create /dist folder with compiled JavaScript

# Check compiled output
ls -la dist/

# You should see:
# - dist/main.js
# - dist/config/env.js
# - dist/services/
# - etc.

# Build frontend
cd ../frontend
npm run build

# Expected: Successful Next.js build
# Should create .next folder
```

**What this tests:**
✅ TypeScript compilation  
✅ Type safety  
✅ No syntax errors  
✅ Source maps  

---

## 🔍 COMPLETE TEST CHECKLIST

### **Infrastructure** (5 minutes)
- [ ] Docker services start successfully
- [ ] All services show as "Up"
- [ ] Health checks pass
- [ ] Logs show no errors

### **Database** (2 minutes)
- [ ] PostgreSQL connects
- [ ] Schema tables created
- [ ] pgvector extension loaded
- [ ] Indexes created

### **Backend API** (3 minutes)
- [ ] Server starts on port 3001
- [ ] Health endpoint responds
- [ ] Security headers present
- [ ] LLM provider logged

### **Frontend UI** (3 minutes)
- [ ] Page loads on port 3000
- [ ] Chat interface renders
- [ ] Suggested questions visible
- [ ] Input field works
- [ ] Send button clickable

### **Configuration** (2 minutes)
- [ ] .env file loaded
- [ ] LLM provider selected
- [ ] Environment variables accessible
- [ ] Config validation works

### **Services** (3 minutes)
- [ ] CORS enabled
- [ ] Rate limiting active
- [ ] Redis accessible
- [ ] Database accessible

---

## 📊 TEST RESULTS TEMPLATE

```
✅ Docker Services
   ├─ PostgreSQL: UP
   ├─ Redis: UP
   ├─ Backend: UP
   └─ Frontend: UP

✅ Database
   ├─ Schema initialized: YES
   ├─ Tables created: 7/7
   ├─ Indexes created: YES
   └─ pgvector extension: LOADED

✅ Backend API
   ├─ Server started: YES
   ├─ Health endpoint: 200 OK
   ├─ Security headers: YES
   └─ LLM Provider: openai/claude/ollama

✅ Frontend UI
   ├─ Page loads: YES
   ├─ Components render: YES
   ├─ Styling applied: YES
   └─ Animations work: YES

✅ Configuration
   ├─ .env loaded: YES
   ├─ Variables read: YES
   ├─ Validation passed: YES
   └─ LLM provider selected: YES
```

---

## 🐛 TROUBLESHOOTING

### **Services won't start**
```bash
# Check Docker logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs backend

# Restart services
docker-compose down
docker-compose up -d
```

### **Backend crashes immediately**
```bash
# Check for port conflicts
lsof -i :3001
lsof -i :5432
lsof -i :6379

# View detailed error logs
docker-compose logs backend --tail=50
```

### **Database schema not initialized**
```bash
# Manually run schema
docker-compose exec postgres psql -U postgres -d fitness_chat -f /docker-entrypoint-initdb.d/01-schema.sql

# Or check if file exists
docker-compose exec postgres ls -la /docker-entrypoint-initdb.d/
```

### **Frontend not loading**
```bash
# Check Next.js build logs
docker-compose logs frontend

# Rebuild frontend
docker-compose exec frontend npm run build

# Check port 3000 availability
lsof -i :3000
```

### **CORS errors**
```bash
# Check CORS configuration
curl -i http://localhost:3001/health

# Verify .env has correct CORS_ORIGIN
echo $CORS_ORIGIN
```

---

## ✨ WHAT'S WORKING

| Feature | Status | Notes |
|---------|--------|-------|
| Docker Setup | ✅ | All services configured |
| Database Schema | ✅ | Auto-initialized |
| Backend API | ✅ | Health endpoint works |
| Frontend UI | ✅ | Components render |
| Configuration | ✅ | LLM provider switchable |
| CORS | ✅ | Configured |
| Rate Limiting | ✅ | Middleware active |
| Redis | ✅ | Running and accessible |
| TypeScript | ✅ | Full type safety |
| Security | ✅ | Helmet.js enabled |

---

## ⏳ WHAT'S NOT YET WORKING

| Feature | Status | Notes |
|---------|--------|-------|
| Chat Endpoint | ❌ | Returns placeholder |
| LLM Integration | ❌ | Not wired yet |
| Vector Search | ❌ | Not implemented |
| Data Ingestion | ❌ | Pipeline not ready |
| Intent Detection | ❌ | Logic skeleton only |
| Caching Logic | ❌ | Not integrated |
| Admin Panel | ❌ | Not implemented |
| Real Chat | ❌ | Not functional |

---

## 📋 NEXT TEST PHASE

Once Phase 2 backend implementation is complete, we can test:
- ✅ Chat endpoint functionality
- ✅ LLM response generation
- ✅ Vector search operations
- ✅ Intent detection accuracy
- ✅ Caching efficiency
- ✅ End-to-end conversation flow

---

## 🎯 QUICK START TEST SEQUENCE

```bash
# 1. Start services
cd /Users/vijay/Documents/fitnessPOS/fitness-chat-app
docker-compose up -d

# 2. Wait for startup
sleep 15

# 3. Check services
docker-compose ps

# 4. Test health endpoint
curl http://localhost:3001/health

# 5. Open frontend
open http://localhost:3000

# 6. View logs
docker-compose logs -f backend
```

Expected time: **5-10 minutes** for full infrastructure test

---

**Ready to test?** Start with `docker-compose up -d` and follow the procedures above! 🚀
