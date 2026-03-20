'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SarvamVoiceService from '@/services/sarvam.service';

interface VoiceControlsProps {
  onVoiceInput?: (text: string) => void;
  onPlayVoiceOutput?: (text: string) => void;
  isListening?: boolean;
  isPlaying?: boolean;
}

const MAX_RECORDING_DURATION = 30000; // 30 seconds max
const SILENCE_DURATION = 2000; // 2 seconds of silence to stop
const SILENCE_THRESHOLD = -50; // dB threshold for silence detection

export function VoiceControls({
  onVoiceInput,
  onPlayVoiceOutput,
  isListening = false,
  isPlaying = false,
}: VoiceControlsProps) {
  const [localListening, setLocalListening] = useState(false);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const voiceServiceRef = useRef<SarvamVoiceService | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const apiKey = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SARVAM_API_KEY : undefined;
    voiceServiceRef.current = new SarvamVoiceService(apiKey);
    console.log('VoiceControls initialized with API key:', apiKey ? 'present' : 'missing');
  }, []);

  const startListening = async () => {
    try {
      setError(null);
      setLocalListening(true);
      setTranscribedText('');

      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');

      // Try to use WAV format, fallback to default if not supported
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav' 
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
      
      console.log('Creating MediaRecorder with MIME type:', mimeType || 'default');
      mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      // Setup audio analysis for silence detection
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048;

        // Monitor volume for silence detection
        const monitorSilence = () => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const isVolume = average > 30; // Threshold for detecting sound

          if (!isVolume) {
            // Silence detected - reset timer
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
            }
            
            silenceTimeoutRef.current = setTimeout(() => {
              console.log('Silence detected for 2 seconds, stopping recording...');
              stopListening();
            }, SILENCE_DURATION);
          } else {
            // Sound detected - clear silence timer
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = null;
            }
          }

          // Continue monitoring
          if (localListening || mediaRecorderRef.current?.state === 'recording') {
            requestAnimationFrame(monitorSilence);
          }
        };
        
        monitorSilence();
      } catch (err) {
        console.warn('Could not setup audio analysis:', err);
      }

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('Audio chunk received:', event.data.size, 'bytes');
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        // Clear all timeouts
        if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach((track) => track.stop());
        
        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }

        console.log('Recording stopped. Audio size:', audioBlob.size, 'bytes');

        if (audioBlob.size === 0) {
          setError('No audio recorded. Please try again.');
          setLocalListening(false);
          return;
        }

        try {
          if (voiceServiceRef.current) {
            console.log('Starting transcription with API service...');
            const result = await voiceServiceRef.current.speechToText(audioBlob);
            console.log('Transcription result:', result);
            setTranscribedText(result.transcript);
            if (result.transcript) {
              onVoiceInput?.(result.transcript);
              setError(null);
            } else {
              setError('No text received from transcription. Please try again.');
            }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to transcribe audio';
          setError(errorMessage);
          console.error('Transcription error:', err);
        } finally {
          setLocalListening(false);
        }
      };

      mediaRecorderRef.current.onerror = (event) => {
        setError('Microphone error: ' + event.error);
        setLocalListening(false);
        console.error('MediaRecorder error:', event.error);
      };

      // Start recording only once
      mediaRecorderRef.current.start();
      console.log('Recording started. Listening for voice input...');

      // Auto-stop after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('Auto-stopping recording after 30 seconds (max duration reached)');
          stopListening();
        }
      }, MAX_RECORDING_DURATION);
    } catch (err) {
      let errorMessage = 'Microphone access denied';
      let detailedError = '';

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied';
          detailedError = 'To enable voice input:\n1. Check browser address bar for a permission prompt\n2. If already dismissed, go to Settings → Privacy → Microphone\n3. Find "Fitness Chat" and change to "Allow"\n4. Refresh the page and try again';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No microphone device found';
          detailedError = 'Please check that:\n1. Your device has a microphone\n2. Microphone is not in use by another application\n3. Try refreshing the page';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Microphone is unavailable';
          detailedError = 'Your microphone is either:\n1. Already in use by another app\n2. Disabled in system settings\n3. Disconnected (for external mics)\n\nPlease resolve and try again.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Security error accessing microphone';
          detailedError = 'This usually happens when:\n1. The site is not using HTTPS (required for mic access)\n2. Try: localhost is allowed for testing\n3. Contact support if issue persists';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(detailedError || errorMessage);
      setLocalListening(false);
      console.error('Microphone error:', err);
    }
  };

  const stopListening = () => {
    // Clear all timeouts
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('Stopping recording...');
      // Clear timeout if it exists
      if ((mediaRecorderRef.current as any).timeoutId) {
        clearTimeout((mediaRecorderRef.current as any).timeoutId);
      }
      mediaRecorderRef.current.stop();
    }
  };

  const playVoiceOutput = async (text: string) => {
    try {
      setError(null);
      setLocalPlaying(true);

      if (voiceServiceRef.current) {
        const audioBlob = await voiceServiceRef.current.textToSpeech(text, {
          language: 'en',
          voice: 'Shubh',
          pace: 1.0,
        });

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioElementRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setLocalPlaying(false);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setLocalPlaying(false);
          setError('Failed to play audio');
        };

        await audio.play();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate speech';
      setError(errorMessage);
      setLocalPlaying(false);
    }
  };

  const stopPlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      setLocalPlaying(false);
    }
  };

  const isActive = localListening || localPlaying;

  return (
    <div className="flex items-center gap-2">
      {/* Voice Input Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={localListening ? stopListening : startListening}
        disabled={isPlaying || localPlaying}
        className={`p-2 rounded-lg transition-all ${
          localListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50'
        }`}
        title={localListening ? 'Stop recording' : 'Start voice input'}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm0 2c-2.76 0-5.3.6-7.64 1.76L2.56 20c3.97 1.33 8.25 1.33 12.32 0l-1.8-1.46C17.3 16.6 14.76 16 12 16zm0-10V5c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6c0-.55.45-1 1-1z" />
        </svg>
      </motion.button>

      {/* Voice Output Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => (localPlaying ? stopPlayback() : onPlayVoiceOutput?.(''))}
        disabled={isListening || localListening}
        className={`p-2 rounded-lg transition-all ${
          localPlaying
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50'
        }`}
        title={localPlaying ? 'Stop playback' : 'Play voice output'}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.3-2.5-4.04v8.05c1.48-.75 2.5-2.27 2.5-4.01zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      </motion.button>

      {/* Status Indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 ml-2"
          >
            {localListening && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
                <span className="text-xs text-gray-600">Listening...</span>
              </>
            )}
            {localPlaying && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
                <span className="text-xs text-gray-600">Playing...</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-0 mb-2 bg-red-50 border-l-4 border-red-500 rounded p-3 max-w-xs shadow-lg"
          >
            <div className="text-sm text-red-900 font-semibold mb-1">⚠️ Voice Access Issue</div>
            <div className="text-xs text-red-700 whitespace-pre-line">{error}</div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcribed Text Display */}
      {transcribedText && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-gray-600 ml-2 max-w-xs truncate"
        >
          "{transcribedText}"
        </motion.div>
      )}
    </div>
  );
}

export default VoiceControls;
