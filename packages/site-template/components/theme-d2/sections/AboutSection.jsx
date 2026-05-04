import React from 'react';
import { motion } from 'framer-motion';

export const AboutSection = ({ title, subtitle, content }) => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] mb-4"
              style={{ fontFamily: 'var(--font-heading, inherit)' }}
            >
              {title}
            </h2>
            {subtitle && <p className="text-xl text-gray-600 mb-6">{subtitle}</p>}
            <p className="text-gray-700 leading-relaxed">{content.text}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-96 lg:h-full min-h-[400px]"
          >
            <img
              src={content.image}
              alt={title}
              className="w-full h-full object-cover rounded-lg shadow-2xl"
            />
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};


