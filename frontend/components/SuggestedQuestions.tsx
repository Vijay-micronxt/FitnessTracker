import React from 'react';
import { motion } from 'framer-motion';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      <p className="text-sm text-red-700 font-medium">💡 Suggested questions:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {questions.map((question, idx) => (
          <motion.button
            key={idx}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(question)}
            className="p-3 text-left text-sm bg-white hover:bg-red-50 rounded-lg border-2 border-red-300 hover:border-red-600 transition-all text-red-900 hover:text-red-700 shadow-sm hover:shadow-md"
          >
            {question}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
