import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-[var(--color-secondary)] border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-gray-600">Loading...</p>
      </motion.div>
    </div>
  );
};

export const ErrorMessage = ({ message }) => {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">?ая?</div>
        <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          {message || 'Unable to load content. Please try again later.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[var(--color-secondary)] text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};


