# Sarvam AI Voice Integration

This project now includes voice-based conversation capabilities using Sarvam AI's speech recognition and text-to-speech APIs.

## Features

### Speech-to-Text (Saaras V3)
- **22 Indian Languages** with automatic detection
- **Code-mixing support** (e.g., mixing Hindi and English mid-sentence)
- **High accuracy** even with background noise
- Real-time transcription with streaming API support
- Speaker diarization for multi-speaker conversations

### Text-to-Speech (Bulbul V3)
- **11 Indian Languages** with natural-sounding voices
- **25+ unique voice options** across different styles and tones
- **Emotion-rich voices** with expressive capabilities
- **Configurable parameters**: pace (0.5x to 2x) and temperature (0.01-1.0)
- Low-latency streaming (<250ms first byte)
- Language switching within the same conversation

## Setup

### 1. Install Dependencies

The required packages are already in `package.json`, but ensure you have:
```bash
cd frontend
npm install
```

### 2. Get Sarvam API Key

1. Visit [Sarvam AI Dashboard](https://dashboard.sarvam.ai)
2. Sign up or log in to your account
3. Generate an API key
4. Add it to your `.env.local` file:

```env
NEXT_PUBLIC_SARVAM_API_KEY=your_api_key_here
```

### 3. Enable Microphone Permissions

The app requires microphone access. When you first use voice input, the browser will ask for permission.

## Usage

### Voice Input
1. Click the **microphone button** (🎤) in the voice controls
2. Speak your fitness question
3. The app will automatically transcribe and send your message

### Voice Output
1. After the assistant responds, click the **speaker button** (🔊)
2. Or use the **"Play Response"** button to hear the last assistant message
3. The response will be played aloud in natural voice

### Text Input
- Traditional text input still works as before
- Use `Enter` to send, `Shift+Enter` for new lines

## API Endpoints Used

### Speech-to-Text
- **Endpoint**: `https://api.sarvam.ai/v1/speech-to-text`
- **Method**: POST
- **Supported Formats**: WAV, MP3, AAC, OGG, FLAC, M4A, AMR, WMA, WebM
- **Sample Rate**: 8kHz, 16kHz (streaming)

### Text-to-Speech
- **Endpoint**: `https://api.sarvam.ai/v1/text-to-speech`
- **Streaming Endpoint**: `https://api.sarvam.ai/v1/text-to-speech:stream`
- **Supported Formats**: MP3, WAV, AAC, OPUS, FLAC, PCM, MULAW, ALAW
- **Sample Rates**: 8kHz, 16kHz, 22.05kHz, 24kHz

## Available Voices

### Popular Voices
- **Shubh** - Male, Conversational, Friendly
- **Shreya** - Female, News, Authoritative
- **Manan** - Male, Conversational, Consistent
- **Ishita** - Female, Entertainment, Dynamic

And 21+ more voices available in the dashboard.

## Supported Languages

### Speech-to-Text (22 Languages)
Hindi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Odia, English (Indian accent), Assamese, Konkani, Maithili, Manipuri, Nepali, Santali, Sindhi, Urdu, Kashmiri, Bodo, Dogri

### Text-to-Speech (11 Languages)
Hindi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Odia, English (Indian accent)

## Services

### `SarvamVoiceService` (`/services/sarvam.service.ts`)

A TypeScript service that wraps Sarvam API calls with the following methods:

```typescript
// Speech-to-Text
await speechToText(audioBlob, options?)

// Text-to-Speech
await textToSpeech(text, options?)

// Streaming Text-to-Speech
await streamTextToSpeech(text, options?, onChunk?)

// Utility Methods
playAudio(audioBlob)
recordAudio(durationMs)
```

### `VoiceControls` Component (`/components/VoiceControls.tsx`)

A reusable React component that provides voice input/output UI controls:
- Microphone button with listening indicator
- Speaker button with playback control
- Error handling and status messages
- Real-time transcription display

## Components

### ChatInterface
Enhanced with voice capabilities:
- Voice input handler integrates transcribed text
- Voice output plays assistant responses
- Status indicators for active voice operations

## Error Handling

The app gracefully handles:
- **Microphone access denied** - Shows error message
- **Network errors** - Displays error notification
- **API failures** - Fallback to text mode
- **Audio playback errors** - User-friendly error messages

## Browser Compatibility

Voice features require:
- **Microphone Access**: `navigator.mediaDevices.getUserMedia()`
- **Web Audio API**: `MediaRecorder`, `Audio` element
- **Fetch API**: For API calls
- **Blob/ArrayBuffer**: For audio handling

Supported browsers:
- Chrome/Edge 47+
- Firefox 25+
- Safari 14.1+
- Opera 34+

## Pricing

Visit [Sarvam AI Pricing](https://www.sarvam.ai/api-pricing) for detailed pricing information. Free tier includes limited API calls for testing.

## Support

- [Sarvam Documentation](https://docs.sarvam.ai)
- [Sarvam Discord Community](https://discord.gg/sarvam)
- [GitHub Issues](https://github.com/Vijay-micronxt/FitnessTracker/issues)

## Future Enhancements

- [ ] Language selection dropdown
- [ ] Voice preference selection
- [ ] Audio quality settings
- [ ] Transcription history
- [ ] Language code-mixing detection
- [ ] Real-time streaming transcription
- [ ] Voice-based conversation flow with context
