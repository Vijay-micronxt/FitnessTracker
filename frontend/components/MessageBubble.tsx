import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { dc } from '@/lib/domainConfig';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  citedArticles?: Array<{ title: string; category: string; images?: string[] }>;
  isLoading?: boolean;
  isStreaming?: boolean;
  onPlayAudio?: () => void;
  isPlayingAudio?: boolean;
}

export function MessageBubble({
  content,
  role,
  citedArticles,
  isLoading,
  isStreaming = false,
  onPlayAudio,
  isPlayingAudio = false,
}: MessageBubbleProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const isUser = role === 'user';

  // Blinking cursor effect
  useEffect(() => {
    if (!isStreaming) return;
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
      setShowCursor(false);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < content.length) {
        setDisplayedText((prev) => prev + content.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setShowCursor(false);
      }
    }, 8); // Slightly faster for smoother feel

    return () => clearInterval(interval);
  }, [content, isStreaming]);

  const parseInlineText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|__[^_]+__)/);
    return parts.map((part, i) => {
      if (part.startsWith('**')) return <span key={i} className="font-medium">{part.replace(/\*\*/g, '')}</span>;
      if (part.startsWith('__')) return <span key={i} className="font-medium">{part.replace(/__/g, '')}</span>;
      if (part.startsWith('*'))  return <span key={i} className="italic">{part.replace(/\*/g, '')}</span>;
      if (part.startsWith('_'))  return <span key={i} className="italic">{part.replace(/_/g, '')}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  // Split text on newlines, detect [IMAGE: url] tokens and render inline
  const renderBlocks = (text: string) => {
    // Split into lines first to catch [IMAGE: url] that appear on their own line
    const lines = text.split('\n');
    const blocks: React.ReactNode[] = [];
    let paraLines: string[] = [];
    let key = 0;

    const flushPara = () => {
      if (paraLines.length === 0) return;
      const paraText = paraLines.join('\n').trim();
      paraLines = [];
      if (!paraText) return;

      if (paraText.startsWith('# ')) {
        blocks.push(
          <motion.h1 key={key++} className={`text-lg font-semibold mt-3 mb-2 ${dc.h1Color}`}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            {paraText.replace(/^# /, '')}
          </motion.h1>
        );
      } else if (paraText.startsWith('## ')) {
        blocks.push(
          <motion.h2 key={key++} className={`text-base font-semibold mt-2 mb-1 ${dc.h2Color}`}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            {paraText.replace(/^## /, '')}
          </motion.h2>
        );
      } else if (paraText.startsWith('### ')) {
        blocks.push(
          <motion.h3 key={key++} className="font-medium text-slate-600 mt-1"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            {paraText.replace(/^### /, '')}
          </motion.h3>
        );
      } else if (paraText.startsWith('- ')) {
        blocks.push(
          <motion.ul key={key++} className="list-disc list-inside space-y-1 ml-2 my-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {paraText.split('\n').filter(l => l.startsWith('- ')).map((item, i) => {
              const itemText = item.replace(/^- /, '');
              return (
                <motion.li key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  {parseInlineText(itemText)}
                </motion.li>
              );
            })}
          </motion.ul>
        );
      } else {
        blocks.push(
          <motion.p key={key++} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {parseInlineText(paraText)}
          </motion.p>
        );
      }
    };

    for (const line of lines) {
      const imageMatch = line.match(/^\[IMAGE:\s*(https?:\/\/[^\]]+)\]$/) ||
                         line.match(/^!\[[^\]]*\]\((https?:\/\/[^)]+)\)$/);
      if (imageMatch) {
        flushPara();
        const url = imageMatch[1].trim();
        blocks.push(
          <motion.div key={key++} className="my-3 rounded-xl overflow-hidden shadow-md"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <img
              src={url}
              alt="Relevant illustration"
              className="w-full object-cover max-h-64"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </motion.div>
        );
      } else {
        paraLines.push(line);
        // Flush on blank lines (paragraph separator)
        if (line.trim() === '') flushPara();
      }
    }
    flushPara();
    return blocks;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs sm:max-w-sm lg:max-w-lg px-5 py-4 rounded-2xl shadow-lg ${
          isUser
            ? dc.userBubble
            : 'bg-gray-50 text-gray-900 border border-gray-200 rounded-tl-sm'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${dc.loadingDot} rounded-full animate-bounce`} />
            <div className={`w-2 h-2 ${dc.loadingDot} rounded-full animate-bounce delay-100`} />
            <div className={`w-2 h-2 ${dc.loadingDot} rounded-full animate-bounce delay-200`} />
          </div>
        ) : (
          <>
            <motion.div
              className="text-sm leading-relaxed space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {renderBlocks(displayedText)}
              {/* Blinking cursor */}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: showCursor ? 1 : 0.3 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block w-2 h-5 bg-slate-300 ml-1 align-text-bottom"
                />
              )}
            </motion.div>

            {/* Play Audio Button for Assistant Messages */}
            {!isUser && !isLoading && onPlayAudio && (
              <motion.button
                onClick={onPlayAudio}
                disabled={isPlayingAudio}
                className={`mt-3 inline-flex items-center gap-2 px-3 py-2 rounded ${dc.audioBtn} disabled:opacity-60 text-xs font-medium transition-colors`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{isPlayingAudio ? '🔊 Playing...' : '🔊 Play Response'}</span>
              </motion.button>
            )}

            {citedArticles && citedArticles.length > 0 && !isUser && (
              <div className={`mt-3 pt-3 border-t-2 ${dc.sourcesBorder}`}>
                <p className={`text-xs font-semibold ${dc.sourcesLabel} mb-2`}>📚 Sources:</p>
                <div className="space-y-3">
                  {citedArticles.map((article, idx) => (
                    <div key={idx} className={`text-xs p-2 rounded ${dc.sourceItem}`}>
                      <span className={`font-medium ${dc.sourceTitle}`}>{article.title}</span>
                      <span className={dc.sourceCategory}> • {article.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
