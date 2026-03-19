# 🐳 Docker Installation & Setup Guide

## ⚠️ Status: Docker Not Installed

You got the error `docker-compose: command not found` because **Docker is not installed on your system**.

---

## 🚀 Installation on macOS

### Option 1: Install Docker Desktop (Recommended)

**Docker Desktop** includes Docker, Docker Compose, and a GUI.

#### Step 1: Download
Go to: https://www.docker.com/products/docker-desktop

Select **Mac with Apple Silicon** (M1/M2/M3) OR **Mac with Intel chip**

#### Step 2: Install
1. Open `Docker.dmg`
2. Drag Docker icon to Applications folder
3. Open Applications → Docker.app
4. Enter your password (Docker needs elevated permissions)
5. Wait for Docker to start (icon appears in menu bar)

#### Step 3: Verify Installation
```bash
docker --version
docker compose version  # Modern syntax (no hyphen)
```

Should output:
```
Docker version X.Y.Z, build ...
Docker Compose version X.Y.Z
```

---

### Option 2: Install via Homebrew

```bash
# Install Docker Desktop via Homebrew
brew install docker docker-compose

# Start Docker
open /Applications/Docker.app

# Wait 30 seconds for Docker daemon to start

# Verify
docker --version
```

---

## ✅ Verify Installation

```bash
# Check Docker
docker run hello-world

# Expected output:
# Hello from Docker!
# This message shows that your installation appears to be working correctly.

# Check Docker Compose
docker compose version

# Expected output:
# Docker Compose version X.Y.Z
```

---

## 🎯 After Installation: Run Your Project

```bash
# Navigate to project
cd /Users/vijay/Documents/fitnessPOS/fitness-chat-app

# Start services (use modern syntax - no hyphen!)
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

---

## 📋 Docker Commands (Modern Syntax)

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View status
docker compose ps

# View logs
docker compose logs backend
docker compose logs -f backend

# Connect to service
docker compose exec postgres psql -U postgres

# Restart service
docker compose restart backend

# Remove everything
docker compose down -v  # -v removes volumes too
```

---

## 🔧 Troubleshooting Installation

### Docker not starting?
```bash
# Try starting Docker daemon
open /Applications/Docker.app

# Wait 30 seconds, then verify
docker ps
```

### Permission denied?
```bash
# Docker needs sudo - or add your user to docker group
sudo usermod -aG docker $USER

# Or use sudo
sudo docker ps
```

### Port already in use?
```bash
# Find process using port
lsof -i :3001  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill process if needed
kill -9 <PID>
```

---

## ⏱️ Expected Setup Time

- Download: 2-5 minutes (depends on internet)
- Installation: 2-3 minutes
- First run: 1-2 minutes
- **Total: 5-10 minutes**

---

## ✨ After Docker is Running

You can test:
```bash
# Quick infrastructure test
docker compose up -d
sleep 15
docker compose ps

# Should show all 4 services UP:
# fitness-postgres
# fitness-redis
# fitness-backend
# fitness-frontend
```

---

## 📚 Need Help?

- Docker Docs: https://docs.docker.com/get-started/
- Compose Docs: https://docs.docker.com/compose/
- macOS Installation: https://docs.docker.com/desktop/install/mac-install/

---

**Next Steps:**
1. ✅ Install Docker Desktop
2. ✅ Verify with `docker --version`
3. ✅ Run `docker compose up -d`
4. ✅ Follow QUICK_TEST.md for testing

**Status:** 🔄 Waiting for Docker installation
