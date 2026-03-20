# Local Development Setup for Fitness Chat with Voice

## Quick Start

### 1. Environment Configuration

#### Frontend (.env.local)
```bash
cd fitness-chat-app/frontend
cat .env.local
# Should contain:
# NEXT_PUBLIC_API_URL=http://localhost:3002
# NEXT_PUBLIC_SARVAM_API_KEY=sk_n51bjpx5_CEgYFDaqNMxMGJ6s7LUySxQF
# NEXT_PUBLIC_SARVAM_DEFAULT_LANGUAGE=en
# NEXT_PUBLIC_SARVAM_DEFAULT_VOICE=Shubh
```

#### Backend (.env)
**IMPORTANT:** Update the backend/.env file for local development:
```bash
cd fitness-chat-app/backend

# Change this line:
# FROM: CORS_ORIGIN=https://crafted.storenxt.in
# TO:   CORS_ORIGIN=http://localhost:3000

# Also ensure:
PORT=3002
NODE_ENV=production or development (both work)
LLM_PROVIDER=claude (or openai/ollama based on your setup)
```

### 2. Start Services

**Terminal 1 - Backend:**
```bash
cd fitness-chat-app/backend
npm install  # if not done
npm start
# Should log: "[START] Server running on http://localhost:3002"
```

**Terminal 2 - Frontend:**
```bash
cd fitness-chat-app/frontend
npm install  # if not done
npm start
# Should log: "[next] ready - started server on 0.0.0.0:3000, url: http://localhost:3000"
```

**Terminal 3 - Check services are running:**
```bash
# Backend health check
curl http://localhost:3002/health

# Frontend is serving
curl http://localhost:3000 | grep "Fitness Chat"
```

## How It Works Locally

### 1. Frontend (Port 3000)
- User interface built with Next.js
- Voice controls component with microphone/speaker buttons
- Communicates with backend API at `http://localhost:3002`

### 2. Backend (Port 3002)
- Fastify server running LLM service (Claude/OpenAI/Ollama)
- CORS configured to allow `http://localhost:3000` origin
- Chat endpoint at `/api/chat`
- Health check at `/health`

### 3. CORS Communication
```
Frontend (http://localhost:3000)
         ↓
   Makes fetch request to
         ↓
Backend (http://localhost:3002)
         ↓
   Validates Origin header matches CORS_ORIGIN
         ↓
   Returns response with CORS headers
```

## Multilingual Voice Chat Flow

### Complete Example: Tamil to English to Tamil

```
1. User at http://localhost:3000
   ↓
2. Clicks microphone button → Records audio (Sarvam API)
   ↓
3. Audio is WebM format from browser MediaRecorder
   ↓
4. Sarvam STT recognizes: Tamil (ta-IN)
   ↓
5. Transcript: "வணக்கம்" (Hello)
   ↓
6. Frontend translates to English: "Hello"
   ↓
7. Frontend sends "Hello" to Backend at http://localhost:3002/api/chat
   ↓
8. Backend queries Claude/OpenAI
   ↓
9. Backend returns English response
   ↓
10. Frontend translates response back to Tamil
    ↓
11. Frontend calls Sarvam TTS with Tamil text
    ↓
12. User hears response in Tamil! 🎉
```

## Troubleshooting

### Issue: CORS Error (204 Status)
```
[Error] Origin http://localhost:3000 is not allowed by Access-Control-Allow-Origin
```

**Solution:**
1. Check backend/.env has: `CORS_ORIGIN=http://localhost:3000`
2. Restart backend: `npm start` in backend directory
3. Verify CORS header:
   ```bash
   curl -X OPTIONS http://localhost:3002/api/chat \
     -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" -v | grep access-control
   # Should show: access-control-allow-origin: http://localhost:3000
   ```

### Issue: Backend Port Already in Use
```
listen EADDRINUSE: address already in use :::3002
```

**Solution:**
```bash
# Find process using port 3002
lsof -i :3002

# Kill the process
kill -9 <PID>

# Or change PORT in backend/.env
PORT=3003  # use different port
```

### Issue: Frontend Can't Connect to Backend
```
[Error] Fetch API cannot load http://localhost:3002/api/chat
```

**Checklist:**
- [ ] Backend is running on port 3002
- [ ] Backend .env has `CORS_ORIGIN=http://localhost:3000`
- [ ] Frontend .env has `NEXT_PUBLIC_API_URL=http://localhost:3002`
- [ ] Both services restarted after env changes
- [ ] No firewall blocking port 3002

### Issue: Microphone Permission Error
```
[Error] Microphone permission denied
```

**Solution:**
- Accept the browser permission prompt when it appears
- Or change browser settings:
  - Chrome/Edge: Settings → Privacy → Microphone → Allow localhost
  - Firefox: about:preferences → Privacy → Permissions → Microphone

### Issue: Voice Input Not Translating
Check browser console for translation errors:
```
[Log] Translating from ta-IN to English...
[Warning] Translation API failed: fetch error
[Log] Translation result: "Hello"
```

**Solution:**
- Check internet connection (translation API needs network)
- Verify MyMemory API is not blocked: `curl https://api.mymemory.translated.net/get?q=hello&langpair=ta|en`

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (localhost:3000)              │
│                    ┌────────────────────┐                │
│                    │  ChatInterface.tsx │                │
│                    └────────┬───────────┘                │
│                             │                            │
│   ┌──────────────────────────┼──────────────────────┐   │
│   │                          │                      │   │
│   ▼                          ▼                      ▼   │
│ ┌──────────┐         ┌──────────────┐        ┌─────┐   │
│ │ Sarvam   │         │  Translation │        │ TTS │   │
│ │ STT API  │         │  MyMemory    │        │ API │   │
│ │ (Remote) │         │  (Remote)    │        │(Rem)│   │
│ └──────────┘         └──────────────┘        └─────┘   │
└─────────────────────────────────────────────────────────┘
          ▲                      │
          │              ┌───────┘
          │              │
    [Send Audio]   [Send Message]
          │              │
          │              ▼
     [CORS Policy]  ┌─────────────────────────────────────┐
          │         │  Backend (localhost:3002)           │
          │         │  ┌────────────────────────────────┐ │
          │         │  │  Fastify Server                │ │
          │         │  │  - /api/chat endpoint          │ │
          │         │  │  - CORS: http://localhost:3000│ │
          │         │  │  - Rate limiting               │ │
          │         │  │  - Helmet security             │ │
          │         │  └──────────┬─────────────────────┘ │
          │         │             │                       │
          │         │             ▼                       │
          │         │  ┌──────────────────────────────┐  │
          │         │  │  LLM Service (Claude/OpenAI) │  │
          │         │  │  - Fitness knowledge base     │  │
          │         │  │  - Data service (JSON)        │  │
          │         │  │  - Response generation        │  │
          │         │  └──────────────────────────────┘  │
          │         └─────────────────────────────────────┘
          │
    [CORS Headers]
          │
          └─ If Origin != CORS_ORIGIN → Block (204 error)
             If Origin == CORS_ORIGIN → Allow response
```

## Testing the Full Flow

### Manual Testing Steps

1. **Start services:**
   ```bash
   # Terminal 1
   cd backend && npm start
   
   # Terminal 2
   cd frontend && npm start
   ```

2. **Open browser:**
   - Navigate to http://localhost:3000
   - Should see fitness chat interface

3. **Test English voice input:**
   - Click microphone button
   - Speak: "How to build muscle?"
   - Check console logs for STT working
   - Response should appear in chat

4. **Test regional language input:**
   - Click microphone button
   - Speak Tamil: "வாழ்க்கை பயிற்சி செய்ய வேண்டுமா?" (Should I exercise daily?)
   - Check logs:
     - STT detects: `ta-IN`
     - Translates to English
     - Gets backend response
     - Translates back to Tamil
     - Plays Tamil TTS

5. **Check CORS is working:**
   ```bash
   # In browser DevTools → Network tab
   # POST request to http://localhost:3002/api/chat
   # Response headers should include:
   # access-control-allow-origin: http://localhost:3000
   ```

## Development Tips

### 1. Enable Verbose Logging
Frontend console shows detailed logs about:
- Microphone permissions
- Audio recording progress
- STT transcription
- Translation process
- TTS playback

Backend logs show:
- CORS origin validation
- LLM provider initialization
- Chat message processing
- Performance metrics

### 2. Monitor Network
Use browser DevTools → Network tab to see:
- API requests to `http://localhost:3002/api/chat`
- CORS preflight requests (OPTIONS)
- Audio file uploads to Sarvam API
- Translation requests to MyMemory

### 3. Debug CORS Issues
```bash
# Test CORS manually
curl -X OPTIONS http://localhost:3002/api/chat \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i access-control

# Should return:
# access-control-allow-origin: http://localhost:3000
# access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
# access-control-allow-credentials: true
```

## Production vs Development

| Aspect | Development | Production |
|--------|-------------|-----------|
| Frontend Port | 3000 | 443 (HTTPS) |
| Backend Port | 3002 | 443 (HTTPS) |
| CORS Origin | http://localhost:3000 | https://crafted.storenxt.in |
| Env Files | .env.local | .env (server-side) |
| Node Env | development | production |
| LLM Provider | claude | claude (or configured) |

To switch to production CORS:
```bash
# In backend/.env
CORS_ORIGIN=https://crafted.storenxt.in
# Then restart backend
```

## Next Steps

1. **Test voice features:** Go to http://localhost:3000 and test microphone
2. **Try different languages:** Speak in Tamil, Hindi, Telugu, etc.
3. **Monitor logs:** Watch DevTools Console and backend terminal
4. **Check translations:** Verify MyMemory translations are accurate
5. **Test error scenarios:** Deny microphone permission, go offline, etc.

For issues or questions, check:
- Browser Console (DevTools → Console tab)
- Backend Terminal Output
- Network tab in DevTools
- System microphone permissions
