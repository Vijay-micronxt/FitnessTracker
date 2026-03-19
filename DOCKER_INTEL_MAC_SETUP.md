# 🐳 DOCKER SETUP FOR YOUR MAC (Intel)

## ✅ Your Mac: Intel Core i7

You need **Docker Desktop for Mac (Intel)** not the Apple Silicon version.

---

## 🚀 INSTALLATION STEPS

### Step 1: Download Docker Desktop
**Download Link:** https://desktop.docker.com/mac/main/amd64/Docker.dmg

This is the **Intel version** (AMD64) - correct for your 6-Core Intel Core i7

### Step 2: Install
1. Download will save to `~/Downloads/Docker.dmg`
2. Double-click to open
3. Drag the Docker icon to Applications folder
4. Wait for copy to complete (2-3 minutes)
5. Open Applications → Docker.app
6. Enter your Mac password (Docker needs admin access)
7. Wait for Docker icon to appear in top menu bar

### Step 3: Verify Installation
Open Terminal and run:
```bash
docker --version
# Should output: Docker version 25.x.x, build xxxxx

docker compose version
# Should output: Docker Compose version 2.x.x
```

### Step 4: Quick Test
```bash
docker run hello-world
# Should download and run successfully
```

---

## 📊 Installation Time Estimate

| Step | Time |
|------|------|
| Download (1.5GB) | 3-10 min |
| Extract & Install | 2-3 min |
| Start Docker daemon | 1-2 min |
| Verify | 1 min |
| **Total** | **7-16 min** |

---

## 🎯 After Installation: First Run

```bash
# Navigate to your project
cd /Users/vijay/Documents/fitnessPOS/fitness-chat-app

# Start all services (this pulls images first time - ~5 minutes)
docker compose up -d

# Check everything is running
docker compose ps

# You should see:
# NAME           STATUS
# fitness-postgres    Up (healthy)
# fitness-redis       Up (healthy) 
# fitness-backend     Up
# fitness-frontend    Up
```

---

## 🐛 If Something Goes Wrong

### Docker won't start?
```bash
# Force quit if stuck
killall Docker

# Restart
open /Applications/Docker.app

# Wait 2 minutes
docker ps
```

### Permission denied?
```bash
# Your user needs docker access
# Run once with sudo:
sudo chgrp -R admin /var/run/docker.sock

# Or just use sudo:
sudo docker ps
```

### Port already in use?
```bash
# Find what's using ports
lsof -i :3001  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill process (replace XXXX with PID)
kill -9 XXXX
```

### First run takes forever?
Docker pulls images (PostgreSQL, Redis, Node) - first time only
- **First run**: 5-10 minutes
- **Subsequent runs**: 5-30 seconds

---

## ✨ YOUR SETUP CHECKLIST

```
[ ] 1. Download Docker Desktop (Intel version)
[ ] 2. Install to Applications folder
[ ] 3. Start Docker.app from Applications
[ ] 4. Wait for menu bar icon
[ ] 5. Verify: docker --version
[ ] 6. Verify: docker compose version
[ ] 7. Test: docker run hello-world
[ ] 8. cd to /Users/vijay/Documents/fitnessPOS/fitness-chat-app
[ ] 9. Run: docker compose up -d
[ ] 10. Check: docker compose ps
```

---

## 🎯 When Everything is Working

```bash
# These commands will work:
docker compose ps          # See all services
docker compose logs        # View logs
docker compose exec postgres psql -U postgres  # Connect to DB
docker compose exec redis redis-cli ping       # Test Redis
curl http://localhost:3001/health              # Test backend
open http://localhost:3000                     # Open frontend
```

---

## 📞 STILL STUCK?

If installation fails:

1. **Check your internet** - ~1.5GB download
2. **Free up disk space** - Need at least 5GB free
3. **Restart your Mac** - Sometimes helps
4. **Check system requirements**:
   - macOS 11 or newer
   - Intel Core i5 or newer ✅ (You have i7)
   - 4GB RAM minimum ✅

---

## 📖 ONCE DOCKER IS WORKING

See these files for next steps:
- `QUICK_TEST.md` - 5-minute smoke test
- `TESTING_GUIDE.md` - Comprehensive tests
- `TEST_SCOPE.md` - What can be tested

---

**Status**: 🔴 Docker not installed → 🟡 Install Docker Desktop → 🟢 Run project

**Next Command After Installation**:
```bash
cd /Users/vijay/Documents/fitnessPOS/fitness-chat-app
docker compose up -d
```

---

## 🔗 RESOURCES

- Docker Desktop Download: https://desktop.docker.com/mac/main/amd64/Docker.dmg
- Docker Docs: https://docs.docker.com/desktop/install/mac-install/
- Docker Compose Docs: https://docs.docker.com/compose/
- Intel Mac Setup Guide: https://docs.docker.com/desktop/install/mac-install/

**⏱️ Estimated Time to Completion: 15 minutes** ⏳
