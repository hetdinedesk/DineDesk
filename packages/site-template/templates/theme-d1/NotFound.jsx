import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-9xl font-bold text-[var(--color-secondary)] mb-4"
            style={{ fontFamily: 'var(--font-heading, inherit)' }}
          >
            404
          </h1>
          <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-[var(--color-secondary)] text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
          >
            <Home size={20} />
            <span>Back to Home</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}


