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
      <p className="text-sm text-slate-400 font-medium">Suggested questions:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {questions.map((question, idx) => (
          <motion.button
            key={idx}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(question)}
            className="p-3 text-left text-sm bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-blue-500 transition-all text-slate-300 hover:text-white"
          >
            {question}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
