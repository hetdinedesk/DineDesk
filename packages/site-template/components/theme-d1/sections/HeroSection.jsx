import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { withSiteParam, getSiteId } from '../../../lib/links';

export const HeroSection = ({ title, subtitle, image, cta }) => {
  const router = useRouter();
  const siteId = getSiteId(router);
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
          style={{ fontFamily: 'var(--font-heading, inherit)' }}
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-white mb-8"
        >
          {subtitle}
        </motion.p>
        {cta && cta.url && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {(cta.url || '').startsWith('http') ? (
              <a
                href={cta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-[var(--color-secondary)] text-white px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
              >
                <span className="font-semibold">{cta.text}</span>
                <ArrowRight size={20} />
              </a>
            ) : (
              <Link
                href={withSiteParam(cta.url, siteId)}
                className="inline-flex items-center space-x-2 bg-[var(--color-secondary)] text-white px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
              >
                <span className="font-semibold">{cta.text}</span>
                <ArrowRight size={20} />
              </Link>
            )}
          </motion.div>
        )}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-white rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
};


