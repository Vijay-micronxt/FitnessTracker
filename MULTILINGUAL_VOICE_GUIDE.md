# Multilingual Voice Support Guide

## Overview

The Fitness Chat application now supports voice input and output in multiple Indian languages with automatic translation. Users can speak in their regional language, and the system will understand, process, and respond in the same language.

## How It Works

### Complete Multilingual Pipeline

```
User speaks in Hindi/Tamil/etc
        ↓
STT (Saaras V3) detects language & transcribes
        ↓
Auto-translate to English (if non-English)
        ↓
Query fitness knowledge base (in English)
        ↓
Get response from assistant (in English)
        ↓
Auto-translate response back to user's language
        ↓
TTS (Bulbul V3) speaks response in user's language
```

## Supported Languages

### Speech-to-Text (STT) - Saaras V3
- Hindi (hi-IN)
- Tamil (ta-IN)
- Telugu (te-IN)
- Bengali (bn-IN)
- Gujarati (gu-IN)
- Kannada (kn-IN)
- Malayalam (ml-IN)
- Marathi (mr-IN)
- Punjabi (pa-IN)
- Odia (od-IN)
- Urdu (ur-IN)
- Assamese (as-IN)
- And 11 more Indian languages

### Text-to-Speech (TTS) - Bulbul V3
- English, Hindi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Odia

### Translation Support
Uses MyMemory Translation API for free translation between languages and English.

## Features

### 1. Automatic Language Detection
- The system automatically detects which language the user speaks
- No manual language selection needed
- Language is detected from the voice input itself

### 2. Transparent Translation
- User hears response in their spoken language
- Translation happens automatically in the background
- No UI disruption or delay indicators visible

### 3. Session-Aware Language
- Once user speaks in a language, the system remembers it
- All subsequent responses are spoken in that language
- Can switch languages by speaking in a different language

### 4. Fallback Handling
- If translation fails, system uses English as fallback
- If target language TTS unavailable, uses English audio
- User sees error message indicating the issue

## Usage Examples

### Example 1: Hindi Input and Output
1. User clicks microphone button
2. Speaks in Hindi: "सुबह व्यायाम कैसे करें?" (How to exercise in the morning?)
3. System:
   - Detects Hindi (hi-IN)
   - Transcribes Hindi text
   - Translates to English: "How to exercise in the morning?"
   - Gets English response from fitness knowledge base
   - Translates response to Hindi
   - Speaks Hindi response via TTS

### Example 2: Tamil Input and Output
1. User clicks microphone
2. Speaks in Tamil: "தசைகள் வலிமை பெற வேண்டுமா?" (How to build muscle strength?)
3. System:
   - Detects Tamil (ta-IN)
   - Processes and responds in Tamil
   - Plays TTS audio in Tamil

### Example 3: Mixed Session
1. First query in Hindi - gets Hindi response
2. User sends text message in English - system defaults to English
3. Click play to hear last response in language of last voice input

## Technical Implementation

### Components Modified

#### 1. SarvamVoiceService (`frontend/services/sarvam.service.ts`)
**New Methods:**
- `translateToEnglish(text, sourceLang)` - Converts regional language to English
- `translateFromEnglish(text, targetLang)` - Converts English to regional language
- `normalizeLanguageCode(langCode)` - Standardizes language codes (hi-IN → hi)

**Uses:**
- MyMemory Translation API (free, no auth required)
- URL: `https://api.mymemory.translated.net/get`

#### 2. VoiceControls Component (`frontend/components/VoiceControls.tsx`)
**New State:**
- `detectedLanguage` - Tracks language detected from voice input
- `isTranslating` - Shows translation in progress

**New Logic:**
- Detects language from STT result
- Translates non-English input to English before sending to chat
- Passes language code to chat interface callback
- Handles translation errors gracefully

**Updated Interface:**
```tsx
onVoiceInput?: (text: string, language?: string) => void;
// Now includes language parameter for downstream use
```

#### 3. ChatInterface Component (`frontend/components/ChatInterface.tsx`)
**New State:**
- `userLanguage` - Remembers user's spoken language

**New Logic:**
- Receives language from VoiceControls
- Stores user's language preference
- Translates assistant response back to user's language before TTS
- Handles multi-language TTS playback

**Updated Handler:**
```tsx
handlePlayVoiceOutput = async (text?: string) => {
  // Translates response to user's language if needed
  // Generates TTS in user's language
  // Falls back to English if needed
}
```

## Configuration

### Environment Variables
No additional configuration needed beyond:
- `NEXT_PUBLIC_SARVAM_API_KEY` - Your Sarvam API key (existing)

### Translation Service
- Uses **MyMemory Translation API** (free service, no auth needed)
- No rate limiting for typical usage
- Supports 1000+ language pairs

## Performance Considerations

### Latency Addition
- STT: 2-3 seconds (existing)
- Translation: ~500-1000ms per language pair
- TTS: 1-2 seconds (existing)
- **Total additional latency: ~1 second for non-English inputs**

### Optimization Tips
1. Shorter queries translate faster
2. Simple sentences translate more reliably
3. Technical terms may lose precision in translation
4. System responds faster after first translation (caching)

## Error Handling

### Scenario 1: Translation API Unavailable
- **Behavior:** Falls back to English
- **User Impact:** Response spoken in English instead of regional language
- **Workaround:** User can try again after service is restored

### Scenario 2: Language Not Supported for TTS
- **Behavior:** Uses English TTS with translated English text
- **User Impact:** Sees translated text but hears English audio
- **Workaround:** User can read the translated response

### Scenario 3: STT Detects Wrong Language
- **Behavior:** Translation may be inaccurate
- **User Impact:** Response might be in wrong language
- **Workaround:** User should speak more clearly or switch to English input

## Testing the Feature

### Test Case 1: Hindi Voice Input
1. Open app at http://localhost:3000
2. Click microphone button
3. Speak in Hindi: "योग के फायदे क्या हैं?" (What are the benefits of yoga?)
4. **Expected:** Response appears in English in chat, TTS speaks in Hindi

### Test Case 2: Tamil Voice Input
1. Click microphone
2. Speak in Tamil: "ஸ்ட்రெচிங் பயிற்சி எப்படி செய்வது?" (How to do stretching exercises?)
3. **Expected:** Response in English text, Hindi TTS audio

### Test Case 3: Language Switching
1. First voice input: Hindi
2. Second voice input: Tamil
3. **Expected:** TTS should switch from Hindi to Tamil

### Test Case 4: Translation Failure Handling
1. Use VPN or offline mode to block translation API
2. Speak in regional language
3. **Expected:** System shows error, uses English fallback

## Limitations

1. **Translation Quality:** Depends on MyMemory API accuracy
   - Simple health/fitness queries work well
   - Complex explanations may lose nuance
   - Medical terminology might not translate perfectly

2. **Language Support:** Limited to languages supported by:
   - Sarvam API (STT)
   - Sarvam API (TTS)
   - MyMemory API (Translation)

3. **Real-time Constraints:**
   - Translation adds ~1 second latency
   - Not suitable for real-time conversations
   - Good for knowledge base queries

4. **Code-Mixing:** While Sarvam supports Hindi-English code-mixing:
   - Translation API may not handle mixed language well
   - Recommend using single language at a time

## Future Enhancements

1. **Neural Machine Translation**
   - Switch from MyMemory to Google Translate API
   - Improved translation quality
   - Support for more languages

2. **Language-Specific Optimization**
   - Customize STT parameters per language
   - Language-specific TTS voice selection
   - Region-specific dialect support

3. **Context-Aware Translation**
   - Keep fitness domain context during translation
   - Preserve technical terms accurately
   - Maintain conversation history

4. **User Language Profile**
   - Save user's language preference
   - Auto-select language on return visits
   - Support bilingual conversations

## Troubleshooting

### Issue: TTS Speaking in Wrong Language
**Solution:** 
- Check browser console for language detection logs
- Verify Sarvam API is returning correct language_code
- Ensure translation API is working (test with curl)

### Issue: Translation Showing as English
**Solution:**
- Check network tab in browser DevTools
- Verify MyMemory API is responding (not blocked)
- Look for translation API error messages in console

### Issue: Microphone Not Detecting Regional Language
**Solution:**
- Speak more clearly
- Ensure microphone is working (test with English first)
- Check Sarvam API language detection in logs
- Verify API key has access to language

### Issue: No Voice Output
**Solution:**
- Check TTS endpoint is working with curl
- Verify speaker/audio settings in browser
- Ensure audio is not muted
- Check for JavaScript errors in console

## Demo Flow

```
User Journey: Beginner wanting fitness advice in Tamil

1. Opens app → sees welcome screen
2. Clicks microphone → grants permission
3. Speaks: "நான் பொதுவாக பயிற்சி செய்யலாம்?"
   (Can I exercise usually?)
4. STT recognizes: Tamil
5. Transcribed: "நான் பொதுவாக பயிற்சி செய்யலாம்?"
6. Translates to English: "Can I exercise usually?"
7. Backend queries knowledge base → returns English response
8. Response translated back to Tamil
9. TTS plays response in Tamil
10. User hears fitness advice in Tamil!
```

## Support

For issues with:
- **Voice Input:** Check Sarvam API key and permissions
- **Translation:** Check internet connection and MyMemory API status
- **Voice Output:** Check browser audio settings and API key
- **Language Detection:** Enable browser console logs and check language codes

See logs at:
- Browser Console: DevTools → Console tab
- Network Requests: DevTools → Network tab
- Application Logs: Check voice service console.log output
