import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCMS } from '../../../contexts/CMSContext';
import { Clock, Tag } from 'lucide-react';

export const SpecialsSection = ({ title, subtitle }) => {
  const { specials } = useCMS();

  const activeSpecials = specials.filter((special) => {
    if (!special.isActive) return false;
    const now = new Date();
    const validFrom = special.validFrom ? new Date(special.validFrom) : null;
    const validUntil = special.validUntil ? new Date(special.validUntil) : null;
    const afterStart = !validFrom || now >= validFrom;
    const beforeEnd = !validUntil || now <= validUntil;
    return afterStart && beforeEnd;
  });

  if (activeSpecials.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2
            className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] mb-4"
            style={{ fontFamily: 'var(--font-heading, inherit)' }}
          >
            {title}
          </h2>
          {subtitle && <p className="text-xl text-gray-600">{subtitle}</p>}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activeSpecials.map((special, index) => (
            <motion.div
              key={special.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-lg overflow-hidden shadow-xl ${
                special.isHighlighted ? 'ring-4 ring-[var(--color-secondary)]' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row h-full">
                {special.image && (
                  <div className="md:w-2/5 h-64 md:h-auto">
                    <img
                      src={special.image}
                      alt={special.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 p-6 bg-white flex flex-col justify-between">
                  {special.isHighlighted && (
                    <div className="inline-flex items-center space-x-1 text-[var(--color-secondary)] mb-2">
                      <Tag size={16} />
                      <span className="text-sm font-semibold">Featured</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--color-primary)] mb-3">
                      {special.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{special.description}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      {special.price && (
                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl font-bold text-[var(--color-secondary)]">
                            ${special.price.toFixed(2)}
                          </span>
                          {special.originalPrice && (
                            <span className="text-lg text-gray-400 line-through">
                              ${special.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      <span>
                        Valid until {new Date(special.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/specials"
            className="inline-block bg-[var(--color-secondary)] text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
          >
            View All Specials
          </Link>
        </motion.div>
      </div>
    </section>
  );
};


