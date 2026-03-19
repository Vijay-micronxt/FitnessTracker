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

    // Add user message
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
      // Call backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      // Add assistant message
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

      // Add error message
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
    <div className="flex flex-col h-full bg-gradient-to-br from-white via-red-50 to-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b-2 border-red-600 bg-white/80 backdrop-blur px-4 py-4 sm:px-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
          Fitness Assistant
        </h1>
        <p className="text-sm text-red-600 mt-1">
          Ask any fitness question and get expert answers
        </p>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-4">
        {messages.length === 0 && showSuggestions ? (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-2xl w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-12"
              >
                <div className="text-5xl mb-4">💪</div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">Welcome to Fitness Chat</h2>
                <p className="text-red-700">
                  Get personalized answers to your fitness questions powered by AI
                </p>
              </motion.div>

              <SuggestedQuestions
                questions={SUGGESTED_QUESTIONS}
                onSelect={(question) => handleSendMessage(question)}
              />
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t-2 border-red-600 bg-white/80 backdrop-blur px-4 py-4 sm:px-6 shadow-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about fitness..."
            disabled={isLoading}
            className="flex-1 bg-white border-2 border-red-300 rounded-lg px-4 py-3 text-red-900 placeholder-red-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-red-700 hover:bg-red-800 disabled:bg-red-300 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            Send
          </motion.button>
        </form>
        <p className="text-xs text-red-600 mt-2">
          Powered by AI with knowledge from fitness experts
        </p>
      </motion.div>
    </div>
  );
}
