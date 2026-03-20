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

  useEffect(() => {
    voiceServiceRef.current = new SarvamVoiceService();
  }, []);

  const startListening = async () => {
    try {
      setError(null);
      setLocalListening(true);
      setTranscribedText('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach((track) => track.stop());

        try {
          if (voiceServiceRef.current) {
            const result = await voiceServiceRef.current.speechToText(audioBlob);
            setTranscribedText(result.transcript);
            onVoiceInput?.(result.transcript);
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
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Microphone access denied';
      setError(errorMessage);
      setLocalListening(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
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
            className="text-xs text-red-500"
          >
            {error}
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
