# Sarvam AI Voice Configuration
# This file contains all available configuration options for voice integration

## Authentication
# Required: Get from https://dashboard.sarvam.ai
SARVAM_API_KEY=

## Default Language Settings
# Speech-to-Text default language (auto-detect if not set)
STT_DEFAULT_LANGUAGE=en

# Text-to-Speech default language
TTS_DEFAULT_LANGUAGE=en

## Voice Preferences
# Available voices: Shubh, Shreya, Manan, Ishita, and 21+ more
TTS_DEFAULT_VOICE=Shubh

# Voice characteristics
TTS_PACE=1.0              # 0.5 to 2.0 (0.5=slow, 1.0=normal, 2.0=fast)
TTS_TEMPERATURE=0.5       # 0.01 to 1.0 (lower=more consistent, higher=more expressive)

## Audio Settings
# Audio format for both input and output
AUDIO_FORMAT=wav          # Supported: mp3, wav, aac, opus, flac, pcm

# Sample rate for audio (Hz)
AUDIO_SAMPLE_RATE=16000   # Supported: 8000, 16000, 22050, 24000

# Maximum recording duration (milliseconds)
MAX_RECORDING_DURATION=60000  # 60 seconds

## Feature Toggles
# Enable/disable voice features
ENABLE_VOICE_INPUT=true
ENABLE_VOICE_OUTPUT=true

# Enable automatic transcription sending
AUTO_SEND_TRANSCRIPTION=false

# Enable emotion-rich responses
ENABLE_EMOTIONAL_VOICE=true

## API Configuration
# Speech-to-Text options
STT_ENABLE_FORMATTING=true        # Format output with punctuation
STT_ENABLE_TRANSLATION=false      # Translate to English
STT_ENABLE_DIARIZATION=false      # Identify different speakers

# Text-to-Speech options
TTS_ENABLE_CODE_SWITCHING=true    # Allow language switching

## Error Handling
# Retry failed API calls
ENABLE_API_RETRY=true
API_RETRY_ATTEMPTS=3
API_RETRY_DELAY=1000              # milliseconds

# Show debug messages in console
DEBUG_MODE=false

## Browser Support
# Minimum browser versions required for voice features
MIN_CHROME_VERSION=47
MIN_FIREFOX_VERSION=25
MIN_SAFARI_VERSION=14.1
MIN_EDGE_VERSION=79

## Performance
# Cache settings
CACHE_AUDIO_RESPONSES=true
MAX_CACHE_SIZE=50                 # MB

# Timeout settings
STT_TIMEOUT=30000                 # 30 seconds
TTS_TIMEOUT=30000                 # 30 seconds

## Analytics (Optional)
# Track voice usage
ENABLE_VOICE_ANALYTICS=false
ANALYTICS_ENDPOINT=                # Your analytics service

## Advanced Features
# Streaming API settings
USE_STREAMING_API=true
STREAMING_CHUNK_SIZE=8192         # bytes

# WebSocket settings (for streaming)
WEBSOCKET_KEEP_ALIVE=true
WEBSOCKET_PING_INTERVAL=30000     # 30 seconds

## Supported Languages for Reference

### Speech-to-Text (22 Languages)
# hi - Hindi
# en - English
# ta - Tamil
# te - Telugu
# bn - Bengali
# gu - Gujarati
# kn - Kannada
# ml - Malayalam
# mr - Marathi
# pa - Punjabi
# or - Odia
# as - Assamese
# kok - Konkani
# mai - Maithili
# mni - Manipuri
# ne - Nepali
# sat - Santali
# sd - Sindhi
# ur - Urdu
# ks - Kashmiri
# brx - Bodo
# doi - Dogri

### Text-to-Speech (11 Languages)
# hi - Hindi
# en - English
# ta - Tamil
# te - Telugu
# bn - Bengali
# gu - Gujarati
# kn - Kannada
# ml - Malayalam
# mr - Marathi
# pa - Punjabi
# or - Odia

## Available Voices
# Popular Voices:
# - Shubh (Male, Conversational, Friendly)
# - Shreya (Female, News, Authoritative)
# - Manan (Male, Conversational, Consistent)
# - Ishita (Female, Entertainment, Dynamic)
# - Ritu (Female, Professional)
# - Aditya (Male, Natural)
# And 19+ more...

# View all available voices:
# https://dashboard.sarvam.ai/text-to-speech
