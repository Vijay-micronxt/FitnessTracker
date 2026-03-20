'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { SuggestedQuestions } from './SuggestedQuestions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citedArticles?: Array<{ title: string; category: string }>;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'How do I start working out as a beginner?',
  'How can I increase my stamina and endurance?',
  'Why does exercise reduce stress and anxiety?',
  'What is the best way to recover after intense training?',
  'How does exercise improve brain health?',
  'What are effective breathing techniques during workouts?',
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();

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
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Sorry, I could not generate a response.',
        citedArticles: data.citedArticles,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-2xl overflow-hidden"
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
                className="mt-1 p-2 hover:bg-red-600/50 rounded-lg transition-all flex-shrink-0"
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
                Your Personal Fitness Assistant
              </motion.h1>
              <motion.div
                animate={{ 
                  opacity: messages.length === 0 ? 1 : 0,
                  height: messages.length === 0 ? 'auto' : 0,
                  marginBottom: messages.length === 0 ? '0.75rem' : 0
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="text-red-100 text-lg sm:text-xl font-light overflow-hidden"
              >
                Get expert fitness guidance powered by AI. Ask anything about workouts, health, and training.
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 bg-gradient-to-b from-white to-red-50">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && showSuggestions ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-16"
                >
                  <div className="text-7xl mb-6">💪</div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to Your Fitness Journey</h2>
                  <p className="text-gray-600 text-lg">
                    Ask any fitness question and receive personalized expert guidance
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-center text-gray-700 font-semibold mb-6 text-lg">Popular Questions</p>
                  <SuggestedQuestions
                    questions={SUGGESTED_QUESTIONS}
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
        className="bg-white border-t-2 border-red-100 px-4 py-6 sm:px-6 shadow-2xl"
      >
        <div className="max-w-4xl mx-auto">
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
              placeholder="Ask me anything about fitness... (Shift+Enter for new line)"
              disabled={isLoading}
              rows={2}
              className="flex-1 bg-gray-100 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 transition-all text-base resize-none"
              style={{ minHeight: '56px', maxHeight: '120px' }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-red-700 hover:bg-red-800 disabled:bg-red-300 text-white font-bold px-4 sm:px-8 py-3 rounded-xl transition-colors disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex-shrink-0 h-fit mt-0 text-sm sm:text-base"
            >
              Send
            </motion.button>
          </form>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Powered by AI • Expert Fitness Knowledge • Instant Responses
          </p>
        </div>
      </motion.div>
    </div>
  );
}
