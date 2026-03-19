# 🚀 LOCAL DEVELOPMENT SETUP (No Docker Needed!)

**Status**: Alternative to Docker - Run everything locally on your Mac

---

## ✅ WHY THIS IS BETTER FOR DEVELOPMENT

- ✅ Faster startup (no container overhead)
- ✅ Easier debugging
- ✅ Direct access to logs
- ✅ Simpler than Docker
- ✅ No Docker installation issues

---

## 📋 WHAT YOU'LL INSTALL

| Service | Tool | Port | Why |
|---------|------|------|-----|
| Node.js | Homebrew | - | Run backend & frontend |
| PostgreSQL | Homebrew | 5432 | Database with pgvector |
| Redis | Homebrew | 6379 | Cache layer |

---

## 🏗️ STEP-BY-STEP INSTALLATION

### Step 0: Check Homebrew
```bash
brew --version
```

If not installed:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 1: Install Node.js (v20+)

```bash
# Install Node.js
brew install node@20

# Verify
node --version      # Should be v20.x.x
npm --version       # Should be 10.x.x
```

### Step 2: Install PostgreSQL with pgvector

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Wait 10 seconds, then verify
sleep 10
brew services list | grep postgresql

# Should show: postgresql@15 started
```

### Step 3: Create Database & User

```bash
# Connect to PostgreSQL (no password needed locally)
psql -U postgres

# In psql, run these commands:
CREATE DATABASE fitness_chat;
CREATE USER postgres WITH PASSWORD 'password';
ALTER ROLE postgres SUPERUSER;
```

Then exit psql:
```sql
\q
```

### Step 4: Install pgvector Extension

```bash
# Connect to fitness_chat database
psql -U postgres -d fitness_chat

# Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

# Verify
SELECT * FROM pg_extension WHERE extname='vector';

# Exit
\q
```

### Step 5: Load Database Schema

```bash
# Load schema into database
psql -U postgres -d fitness_chat < /Users/vijay/Documents/fitnessPOS/fitness-chat-app/backend/src/db/schema.sql

# Verify tables were created
psql -U postgres -d fitness_chat -c "\dt"

# Should show 7 tables
```

### Step 6: Install Redis

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Wait 5 seconds, then verify
sleep 5
brew services list | grep redis

# Should show: redis started
```

### Step 7: Test Services

```bash
# Test PostgreSQL
psql -U postgres -d fitness_chat -c "SELECT 1;"
# Expected: 1

# Test Redis
redis-cli ping
# Expected: PONG
```

---

## 🚀 NOW RUN THE PROJECT

### Terminal 1: Backend

```bash
cd /Users/vijay/Documents/fitnessPOS/fitness-chat-app/backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/fitness_chat
REDIS_URL=redis://localhost:6379
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
CORS_ORIGIN=http://localhost:3000
EOF

# Edit .env with your OpenAI key if you have one
# nano .env

# Start backend
npm run dev
```

You should see:
```
Server running on http://localhost:3001
LLM Provider: openai
```

### Terminal 2: Frontend

```bash
cd /Users/vijay/Documents/fitnessPOS/fitness-chat-app/frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

### Terminal 3: Check Everything

```bash
# Test backend
curl http://localhost:3001/health

# Expected:
# {"status":"ok","timestamp":"2024-03-14T..."}

# Open frontend
open http://localhost:3000

# Should see chat interface
```

---

## 📊 VERIFICATION CHECKLIST

```bash
# Verify Node.js
node --version        # v20.x.x

# Verify PostgreSQL
psql -U postgres -d fitness_chat -c "SELECT 1;"  # Returns: 1

# Verify pgvector
psql -U postgres -d fitness_chat -c "SELECT * FROM pg_extension WHERE extname='vector';"  # Returns extension

# Verify Redis
redis-cli ping        # Returns: PONG

# Verify Backend (in separate terminal)
curl http://localhost:3001/health  # Returns: {"status":"ok",...}

# Verify Frontend
open http://localhost:3000   # Page loads
```

---

## 📁 PROJECT STRUCTURE FOR LOCAL DEV

```
fitness-chat-app/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── .env (you create this)
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   ├── package.json
│   └── tsconfig.json
```

---

## 🔄 DAILY STARTUP (After First Installation)

```bash
# Terminal 1: Start PostgreSQL + Redis
brew services start postgresql@15
brew services start redis

# Terminal 2: Backend
cd fitness-chat-app/backend
npm run dev

# Terminal 3: Frontend
cd fitness-chat-app/frontend
npm run dev

# Terminal 4: Open browser
open http://localhost:3000
```

---

## 🛑 SHUTDOWN

```bash
# Stop services
brew services stop postgresql@15
brew services stop redis

# Kill terminals (Ctrl+C in each)
```

---

## 🐛 TROUBLESHOOTING

### PostgreSQL won't start?
```bash
# Check status
brew services list | grep postgresql

# Restart
brew services restart postgresql@15

# Check logs
tail -f /usr/local/var/log/postgres.log
```

### Redis won't start?
```bash
# Check status
brew services list | grep redis

# Restart
brew services restart redis

# Or start manually
redis-server
```

### Database already exists?
```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE fitness_chat;"
psql -U postgres -c "CREATE DATABASE fitness_chat;"

# Re-load schema
psql -U postgres -d fitness_chat < backend/src/db/schema.sql
```

### Port already in use?
```bash
# Find process using port
lsof -i :3001
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Kill process (replace PID)
kill -9 <PID>
```

### npm install fails?
```bash
# Clear cache
npm cache clean --force

# Try again
npm install

# Or use yarn
brew install yarn
yarn install
```

---

## ⏱️ INSTALLATION TIME

| Step | Time |
|------|------|
| Homebrew setup | 5 min |
| Node.js | 3 min |
| PostgreSQL + pgvector | 5 min |
| Redis | 2 min |
| Database setup | 3 min |
| Backend npm install | 2 min |
| Frontend npm install | 2 min |
| **TOTAL** | **22 min** |

---

## ✨ WHAT YOU GET

✅ Local development environment  
✅ No Docker needed  
✅ Faster iteration  
✅ Easier debugging  
✅ Same functionality  
✅ Ready for testing  

---

## 🎯 NEXT STEPS

1. Follow installation steps above
2. Run 3 terminals (backend, frontend, logs)
3. See services running locally
4. Test with QUICK_TEST.md
5. Start coding!

---

## 📞 NEED HELP?

If any step fails:
1. Check the troubleshooting section above
2. Verify each service: `brew services list`
3. Check logs for specific errors
4. All tools are easy to uninstall: `brew uninstall <service>`

---

**Status**: Ready for local development without Docker! 🚀
