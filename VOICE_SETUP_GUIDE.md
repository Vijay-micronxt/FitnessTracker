# Voice Integration Quick Setup Guide

## Step 1: Get Sarvam AI API Key

1. Visit [Sarvam AI Dashboard](https://dashboard.sarvam.ai)
2. Create an account or log in
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key

## Step 2: Configure Environment Variables

Create/update `.env.local` file in `/frontend` directory:

```bash
# Copy the example file first (optional)
cp .env.local.example .env.local

# Then edit it and add your API key
NEXT_PUBLIC_SARVAM_API_KEY=your_actual_api_key_here
```

## Step 3: Rebuild and Start

```bash
# From the fitness-chat-app directory
./start.sh
```

The app will be available at `http://localhost:3000`

## Step 4: Test Voice Features

### Speech-to-Text (Input)
1. Click the **microphone button** (🎤) in the voice controls panel
2. Speak a fitness question (e.g., "How do I build muscle?")
3. The transcribed text will appear and be sent automatically

### Text-to-Speech (Output)
1. Ask any question and wait for the response
2. Click the **speaker button** (🔊) or "Play Response" button
3. The assistant's response will be played in a natural voice

## Features Available

✅ **Speech Recognition** - 22 Indian languages with automatic detection
✅ **Text-to-Speech** - 11 languages with 25+ natural voices
✅ **Code-Mixing Support** - Mix Hindi/English seamlessly
✅ **Error Handling** - Graceful fallback if voice unavailable
✅ **Status Indicators** - Real-time listening/playing indicators

## Troubleshooting

### "Microphone access denied"
- Check browser microphone permissions
- Try a different browser
- Restart the browser

### "API key not configured"
- Verify `.env.local` has the correct API key
- Rebuild the app: `npm run build`
- Check that `NEXT_PUBLIC_SARVAM_API_KEY` is present

### "Speech-to-text failed"
- Check your Sarvam API account has credits
- Verify microphone is working
- Check browser console for detailed errors

### "No microphone found"
- Ensure your device has a microphone
- Check device permissions at OS level
- Try using a different microphone device

## API Usage Limits

Check your Sarvam AI account for:
- Daily API call limits
- Character/minute limits
- Concurrent request limits

Upgrade your plan if needed at [Sarvam Pricing](https://www.sarvam.ai/api-pricing)

## Next Steps

1. **Customize voices** - Change default voice in environment variables
2. **Add language selection** - Let users pick their preferred language
3. **Enable streaming** - Real-time transcription as you speak
4. **Add translation** - Get responses in preferred language
5. **Voice preferences** - Save user's voice preferences

## Support Resources

- [Sarvam AI Documentation](https://docs.sarvam.ai)
- [API Reference](https://docs.sarvam.ai/api-reference-docs)
- [Sarvam AI Discord](https://discord.gg/sarvam)
- [GitHub Issues](https://github.com/Vijay-micronxt/FitnessTracker/issues)

## Code References

- **Voice Service**: `/frontend/services/sarvam.service.ts`
- **Voice Component**: `/frontend/components/VoiceControls.tsx`
- **Chat Integration**: `/frontend/components/ChatInterface.tsx`
- **Documentation**: `/frontend/VOICE_INTEGRATION.md`
