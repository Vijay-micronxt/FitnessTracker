'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { SuggestedQuestions } from './SuggestedQuestions';
import { VoiceControls } from './VoiceControls';
import SarvamVoiceService from '@/services/sarvam.service';
import configService from '@/services/config.service';
import { dc } from '@/lib/domainConfig';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citedArticles?: Array<{ title: string; category: string }>;
  timestamp: Date;
  audioData?: string; // Base64 encoded audio
  hasAudio?: boolean; // Flag indicating audio is available
  language?: string; // Language of the response
}


export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [isVoiceOutputActive, setIsVoiceOutputActive] = useState(false);
  const [userLanguage, setUserLanguage] = useState<string>('en');
  const [voiceError, setVoiceError] = useState<string>('');
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [featureFlags, setFeatureFlags] = useState({
    voiceInput: true,
    voiceOutput: false,
    multilingual: true,
    supportedLanguages: ['en', 'es', 'fr', 'hi', 'ta', 'te'],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceServiceRef = useRef<SarvamVoiceService | null>(null);
  const audioChunksCacheRef = useRef<Map<string, Blob[]>>(new Map());
  const lastPlayableMessage = [...messages].reverse().find(
    (message) => message.role === 'assistant' && message.hasAudio
  );

  const normalizeLanguageCode = (language?: string) => {
    if (!language) return 'en';

    const normalized = language.split('-')[0].toLowerCase().trim();
    return normalized || 'en';
  };

  useEffect(() => {
    voiceServiceRef.current = new SarvamVoiceService();
    
    // Fetch feature flags from backend
    const fetchFeatureFlags = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        console.log('🔍 Fetching config from:', apiUrl);
        const config = await configService.getConfig();
        console.log('✅ Feature flags fetched:', config.features);
        setFeatureFlags(config.features);
      } catch (error) {
        console.error('❌ Failed to fetch feature flags:', error);
        // Keep default feature flags on error
        console.log('Using default feature flags');
      }
    };
    
    fetchFeatureFlags();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug: Log when featureFlags change
  useEffect(() => {
    console.log('🎤 Feature flags updated:', featureFlags);
  }, [featureFlags]);

  const prepareVoiceAudio = async (messageId: string, text: string, language: string) => {
    try {
      if (!voiceServiceRef.current) return;

      console.log('🔄 Pre-generating voice audio for message:', messageId);
      const chunks = await voiceServiceRef.current.textToSpeechChunks(text, {
        language,
        voice: 'vidya',
        pace: 1.0,
        format: 'mp3',
      });

      audioChunksCacheRef.current.set(messageId, chunks);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, hasAudio: true }
            : message
        )
      );
      console.log(`✅ Voice audio prepared for message ${messageId} with ${chunks.length} chunk(s)`);
    } catch (error) {
      console.error('❌ Failed to pre-generate voice audio:', error);
    }
  };

  const handleSendMessage = useCallback(
    async (
      text?: string,
      isFromVoice: boolean = false,
      voiceLanguage?: string
    ) => {
      const messageText = text || inputValue.trim();
      const effectiveVoiceLanguage = isFromVoice
        ? normalizeLanguageCode(voiceLanguage || userLanguage)
        : 'en';

      if (!messageText) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setShowSuggestions(false);
      setIsLoading(true);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const response = await fetch(`${apiUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: messageText,
            language: isFromVoice ? effectiveVoiceLanguage : undefined
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();
        let responseContent = data.response || 'Sorry, I could not generate a response.';

        // If voice input was regional, translate only when response is still mostly English.
        if (isFromVoice && effectiveVoiceLanguage !== 'en') {
          const looksEnglish = /^[\x00-\x7F\s\p{P}]*$/u.test(responseContent);
          if (looksEnglish) {
            console.log(`Translating response to ${effectiveVoiceLanguage} for display...`);
            try {
              responseContent = await voiceServiceRef.current?.translateFromEnglish(responseContent, effectiveVoiceLanguage) || responseContent;
              console.log('Translated response for display:', responseContent);
            } catch (err) {
              console.warn('Translation failed, displaying original response:', err);
              // Continue with original response if translation fails
            }
          } else {
            console.log('Response already appears non-English; skipping translation.');
          }
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        citedArticles: data.citedArticles,
        timestamp: new Date(),
        hasAudio: false,
        language: isFromVoice ? effectiveVoiceLanguage : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (isFromVoice && voiceServiceRef.current) {
        console.log('Voice response received. Preparing audio in background...');
        void prepareVoiceAudio(assistantMessage.id, responseContent, effectiveVoiceLanguage);
      }
    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
    },
    [inputValue, userLanguage, voiceServiceRef]
  );

  const handleVoiceInput = useCallback(
    async (text: string, language?: string) => {
      const detectedLanguage = normalizeLanguageCode(language);
      setUserLanguage(detectedLanguage);
      console.log(`🌐 Voice detected in ${detectedLanguage}, will respond in ${detectedLanguage}`);
      
      setLastInputWasVoice(true);
      
      // Automatically send the voice input to LLM with voice flag
      console.log('Voice input received, auto-sending to LLM:', text, 'Language:', language);
      setIsVoiceInputActive(false);
      
      // Send immediately without waiting for user to click send button
      await handleSendMessage(text, true, detectedLanguage);
    },
    []
  );

  const handlePlayVoiceOutput = useCallback(
    async (text?: string, messageId?: string) => {
      try {
        if (messageId) {
          setPlayingMessageId(messageId);
        }
        setIsVoiceOutputActive(true);
        setVoiceError(''); // Clear any previous errors
        
        const targetMessage = messageId 
          ? messages.find(m => m.id === messageId)
          : [...messages].reverse().find((m) => m.role === 'assistant');

        if (!targetMessage && !text) {
          console.warn('No message to play');
          setIsVoiceOutputActive(false);
          setPlayingMessageId(null);
          return;
        }

        const textToPlay = text || targetMessage?.content || '';
        const targetMessageId = messageId || targetMessage?.id;
        const ttsLanguage = (targetMessage?.language && targetMessage.language !== 'en' && targetMessage.language !== '') 
          ? targetMessage.language 
          : (userLanguage !== 'en' && userLanguage !== '' ? userLanguage : 'en');

        console.log('🎤 Starting audio playback:', {
          textLength: textToPlay.length,
          language: ttsLanguage,
          messageId: messageId,
        });

        if (voiceServiceRef.current) {
          console.log(`Playing voice output in language: ${ttsLanguage}`);

          const cachedChunks = targetMessageId
            ? audioChunksCacheRef.current.get(targetMessageId)
            : undefined;

          if (!cachedChunks || cachedChunks.length === 0) {
            setVoiceError('🔄 Audio is still being prepared. Please wait a moment and tap play again.');
            return;
          }

          console.log(`✅ Using cached audio chunks: ${cachedChunks.length}`);
          await voiceServiceRef.current.playAudioSequence(cachedChunks);
          console.log('✅ Audio playback completed successfully');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Voice output failed';
        console.error('❌ Voice output error:', errorMessage, error);
        
        // Show user-friendly error message with specific guidance
        if (errorMessage.includes('Browser blocked') || errorMessage.includes('NotAllowedError')) {
          setVoiceError('🔊 Browser blocked audio playback. Try: 1) Check browser audio settings, 2) Allow audio permissions, 3) Try a different browser.');
        } else if (errorMessage.includes('format not supported')) {
          setVoiceError('❌ Your browser doesn\'t support the audio format. Please try a different browser.');
        } else if (errorMessage.includes('audio')) {
          setVoiceError('⚠️ Audio playback failed: ' + errorMessage);
        } else {
          setVoiceError('⚠️ Voice output failed. Please try again.');
        }
        
        // Clear error after 8 seconds
        setTimeout(() => setVoiceError(''), 8000);
      } finally {
        setIsVoiceOutputActive(false);
        setPlayingMessageId(null);
      }
    },
    [messages, userLanguage]
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${dc.gradient} text-white shadow-2xl overflow-hidden`}
        layout
      >
        <motion.div 
          className="max-w-6xl mx-auto px-4 sm:px-6"
          animate={{
            paddingTop: messages.length === 0 ? '3rem' : '0.75rem',
            paddingBottom: messages.length === 0 ? '4rem' : '0.75rem'
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <div className="flex items-start gap-4">
            {messages.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setMessages([]);
                  setShowSuggestions(true);
                  setInputValue('');
                }}
                className="mt-1 p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
                title="Start new chat"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
            )}
            <div className="flex-1 min-w-0">
              <motion.h1 
                animate={{ 
                  fontSize: messages.length === 0 ? '2.25rem' : '1.875rem',
                  lineHeight: messages.length === 0 ? '2.5rem' : '2rem'
                }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="font-bold font-outfit mb-3 leading-tight"
              >
                {dc.headerTitle}
              </motion.h1>
              <motion.div
                animate={{ 
                  opacity: messages.length === 0 ? 1 : 0,
                  height: messages.length === 0 ? 'auto' : 0,
                  marginBottom: messages.length === 0 ? '0.75rem' : 0
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="text-white/80 text-lg sm:text-xl font-light overflow-hidden"
              >
                {dc.headerSubtitle}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto px-4 py-8 sm:px-6 ${dc.messageBg}`}>
        <div className="max-w-4xl mx-auto">
          {/* Voice Error Message */}
          {voiceError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-medium">Audio Output Issue</p>
                  <p>{voiceError}</p>
                </div>
              </div>
            </motion.div>
          )}

          {messages.length === 0 && showSuggestions ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-16"
                >
                  <div className="text-7xl mb-6">{dc.welcomeIcon}</div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">{dc.welcomeHeading}</h2>
                  <p className="text-gray-600 text-lg">
                    {dc.welcomeSubtext}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-center text-gray-700 font-semibold mb-6 text-lg">Popular Questions</p>
                  <SuggestedQuestions
                    questions={dc.suggestedQuestions}
                    onSelect={(question) => handleSendMessage(question)}
                  />
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  role={message.role}
                  citedArticles={message.citedArticles}
                  isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                  onPlayAudio={message.hasAudio ? () => handlePlayVoiceOutput(message.content, message.id) : undefined}
                  isPlayingAudio={playingMessageId === message.id && isVoiceOutputActive}
                />
              ))}

              {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <MessageBubble content="Thinking..." role="assistant" isLoading />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white border-t-2 ${dc.accentBorder} px-4 py-6 sm:px-6 shadow-2xl`}
      >
        <div className="max-w-4xl mx-auto">
          {/* Debug: Show feature flags status */}
          <div className="mb-2 text-xs text-gray-500">
            🎯 Features: Voice Input={featureFlags.voiceInput ? '✓' : '✗'} | Voice Output={featureFlags.voiceOutput ? '✓' : '✗'} | Multilingual={featureFlags.multilingual ? '✓' : '✗'}
          </div>
          
          {/* Voice Controls - Conditionally Rendered Based on Feature Flags */}
          {(featureFlags.voiceInput || featureFlags.voiceOutput) && (
            <div className="mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
              <VoiceControls
                onVoiceInput={featureFlags.voiceInput ? handleVoiceInput : undefined}
                onPlayVoiceOutput={featureFlags.voiceOutput ? handlePlayVoiceOutput : undefined}
                isListening={isVoiceInputActive}
                isPlaying={isVoiceOutputActive}
                enableInput={featureFlags.voiceInput}
                enableOutput={featureFlags.voiceOutput}
                supportedLanguages={featureFlags.multilingual ? featureFlags.supportedLanguages : ['en']}
              />
              {messages.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlayVoiceOutput(lastPlayableMessage?.content, lastPlayableMessage?.id)}
                  disabled={isVoiceOutputActive || !lastPlayableMessage}
                  className="ml-auto text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors disabled:opacity-50"
                  title="Play last response as voice"
                >
                  🔊 Play Response
                </motion.button>
              )}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-3"
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={dc.inputPlaceholder}
              disabled={isLoading}
              rows={2}
              className={`flex-1 bg-gray-100 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white ${dc.inputFocus} disabled:opacity-50 transition-all text-base resize-none`}
              style={{ minHeight: '56px', maxHeight: '120px' }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className={`${dc.accentColor} ${dc.accentHover} ${dc.accentDisabled} text-white font-bold px-4 sm:px-8 py-3 rounded-xl transition-colors disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex-shrink-0 h-fit mt-0 text-sm sm:text-base`}
            >
              Send
            </motion.button>
          </form>
          <p className="text-xs text-gray-500 mt-3 text-center">
            {dc.footerText}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
