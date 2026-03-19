import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  citedArticles?: Array<{ title: string; category: string; images?: string[] }>;
  isLoading?: boolean;
  isStreaming?: boolean;
}

export function MessageBubble({
  content,
  role,
  citedArticles,
  isLoading,
  isStreaming = false,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-md ${
          isUser
            ? 'bg-red-700 text-white rounded-br-none'
            : 'bg-white text-red-900 border-l-4 border-red-600 rounded-bl-none'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce delay-200" />
          </div>
        ) : (
          <>
            <motion.div 
              className="text-sm leading-relaxed space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {displayedText.split('\n\n').map((paragraph, idx) => {
                // Handle headers
                if (paragraph.startsWith('# ')) {
                  return (
                    <motion.h1 
                      key={idx} 
                      className="text-lg font-semibold mt-3 mb-2 text-red-700"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {paragraph.replace('# ', '')}
                    </motion.h1>
                  );
                }
                if (paragraph.startsWith('## ')) {
                  return (
                    <motion.h2 
                      key={idx} 
                      className="text-base font-semibold mt-2 mb-1 text-red-600"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {paragraph.replace('## ', '')}
                    </motion.h2>
                  );
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <motion.h3 
                      key={idx} 
                      className="font-medium text-slate-100 mt-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {paragraph.replace('### ', '')}
                    </motion.h3>
                  );
                }

                // Handle lists
                if (paragraph.startsWith('- ')) {
                  return (
                    <motion.ul 
                      key={idx} 
                      className="list-disc list-inside space-y-1 ml-2 my-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {paragraph.split('\n').map((item, itemIdx) => {
                        const itemText = item.replace('- ', '');
                        // Parse bold text in list items
                        const parts = itemText.split(/(\*\*[^*]+\*\*)/);
                        return (
                          <motion.li 
                            key={itemIdx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: itemIdx * 0.05 }}
                          >
                            {parts.map((part, i) => 
                              part.startsWith('**') ? (
                                <span key={i} className="font-medium">{part.replace(/\*\*/g, '')}</span>
                              ) : (
                                <span key={i}>{part}</span>
                              )
                            )}
                          </motion.li>
                        );
                      })}
                    </motion.ul>
                  );
                }

                // Regular paragraphs - parse markdown formatting
                const parseText = (text: string) => {
                  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|__[^_]+__)/);
                  return parts.map((part, i) => {
                    if (part.startsWith('**')) {
                      return <span key={i} className="font-medium">{part.replace(/\*\*/g, '')}</span>;
                    }
                    if (part.startsWith('__')) {
                      return <span key={i} className="font-medium">{part.replace(/__/g, '')}</span>;
                    }
                    if (part.startsWith('*')) {
                      return <span key={i} className="italic">{part.replace(/\*/g, '')}</span>;
                    }
                    if (part.startsWith('_')) {
                      return <span key={i} className="italic">{part.replace(/_/g, '')}</span>;
                    }
                    return <span key={i}>{part}</span>;
                  });
                };

                return (
                  <motion.p 
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {parseText(paragraph)}
                  </motion.p>
                );
              })}
              {/* Blinking cursor */}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: showCursor ? 1 : 0.3 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block w-2 h-5 bg-slate-300 ml-1 align-text-bottom"
                />
              )}
            </motion.div>

            {citedArticles && citedArticles.length > 0 && !isUser && (
              <div className="mt-3 pt-3 border-t-2 border-red-300">
                <p className="text-xs font-semibold text-red-700 mb-2">📚 Sources:</p>
                <div className="space-y-3">
                  {citedArticles.map((article, idx) => (
                    <div key={idx} className="text-xs text-red-900 bg-red-50 p-2 rounded border border-red-200">
                      <div>
                        <span className="font-medium text-red-800">{article.title}</span>
                        <span className="text-red-600"> • {article.category}</span>
                      </div>
                      {article.images && article.images.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {article.images.slice(0, 4).map((imageUrl, imgIdx) => (
                            <div key={imgIdx} className="relative overflow-hidden rounded bg-white border border-red-200">
                              <img 
                                src={imageUrl} 
                                alt={`${article.title} - Image ${imgIdx + 1}`}
                                className="w-full h-24 object-cover hover:opacity-80 transition-opacity cursor-pointer"
                                onError={(e) => {
                                  // Handle broken images gracefully
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
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
