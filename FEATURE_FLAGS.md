## Frontend Feature Flag Configuration

The frontend now dynamically fetches feature flags from the backend `/config` endpoint. This allows independent control of voice input/output and multilingual support through backend environment variables.

### How It Works

1. **Backend Configuration** (`.env` file):
   ```env
   # Voice Input/Output Features
   FEATURE_VOICE_INPUT=true         # Enable voice input
   FEATURE_VOICE_OUTPUT=false       # Enable voice output (disabled by default)
   
   # Multilingual Support
   FEATURE_MULTILINGUAL=true        # Enable multilingual support
   SUPPORTED_LANGUAGES=en,es,fr,hi,ta,te  # Comma-separated list
   ```

2. **Backend Endpoints**:
   - `/health` - Returns health status with feature flags
   - `/config` - Returns feature flags for frontend consumption
   
   Example `/config` response:
   ```json
   {
     "features": {
       "voiceInput": true,
       "voiceOutput": false,
       "multilingual": true,
       "supportedLanguages": ["en", "es", "fr", "hi", "ta", "te"]
     },
     "llmProvider": "claude"
   }
   ```

3. **Frontend Configuration Service** (`frontend/services/config.service.ts`):
   - Fetches configuration from backend on app startup
   - Caches configuration to avoid repeated API calls
   - Returns sensible defaults if backend is unavailable
   - Singleton pattern for consistent access throughout the app

4. **Feature Flag Usage** in ChatInterface:
   - On component mount, fetches feature flags from backend
   - Conditionally renders voice controls based on `featureFlags.voiceInput` and `featureFlags.voiceOutput`
   - Passes supported languages to VoiceControls component based on `featureFlags.multilingual`
   - VoiceControls component only renders buttons for enabled features

### Testing Feature Flags

**Disable Voice Input:**
```bash
FEATURE_VOICE_INPUT=false npm run dev
```
Result: Microphone button will not appear

**Disable Voice Output:**
```bash
FEATURE_VOICE_OUTPUT=false npm run dev
```
Result: Speaker button will not appear

**Disable Multilingual Support:**
```bash
FEATURE_MULTILINGUAL=false npm run dev
```
Result: Only English available in voice controls

**Custom Supported Languages:**
```bash
SUPPORTED_LANGUAGES=en,es npm run dev
```
Result: Voice controls will only support English and Spanish

### Frontend Changes

**New Files:**
- `frontend/services/config.service.ts` - Configuration service

**Modified Files:**
- `frontend/components/ChatInterface.tsx` - Fetches feature flags and conditionally renders voice controls
- `frontend/components/VoiceControls.tsx` - Accepts feature flag props and conditionally renders buttons
- `frontend/.env.example` - Updated with explanation of backend-driven feature flags

### Backend Changes

**Modified Files:**
- `backend/src/config/env.ts` - Added feature flag parsing:
  - `featureVoiceInput` - Boolean from `FEATURE_VOICE_INPUT` env var
  - `featureVoiceOutput` - Boolean from `FEATURE_VOICE_OUTPUT` env var
  - `featureMultilingual` - Boolean from `FEATURE_MULTILINGUAL` env var (default: true)
  - `supportedLanguages` - Array from `SUPPORTED_LANGUAGES` env var
  
- `backend/src/main.ts` - Updated endpoints:
  - `/health` now includes features object
  - `/config` new endpoint for frontend to fetch feature flags
  
- `backend/.env.example` - Updated with feature flag section

### Benefits

1. **Independent Control**: Each feature (voice input, voice output, multilingual) can be toggled independently
2. **Environment-Based**: Features are configured via environment variables, supporting different deployments
3. **No Frontend Recompilation**: Changes to feature flags only require backend restart
4. **Frontend Simplicity**: Frontend components react to backend configuration automatically
5. **Graceful Degradation**: Frontend works with default settings if backend is unavailable

### API Integration

Frontend uses:
```typescript
const configService = require('@/services/config.service').default;
const config = await configService.getConfig();
```

Methods available:
- `getConfig()` - Returns complete config
- `isVoiceInputEnabled()` - Check if voice input enabled
- `isVoiceOutputEnabled()` - Check if voice output enabled
- `isMultilingualEnabled()` - Check if multilingual enabled
- `getSupportedLanguages()` - Get list of supported languages
- `clearCache()` - Clear cached configuration
