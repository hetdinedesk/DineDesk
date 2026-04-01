import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCMS } from '../../../contexts/CMSContext';

export const FeaturedItemsSection = ({ title, subtitle }) => {
  const { menuItems } = useCMS();

  const featuredItems = menuItems
    .filter((item) => item.isFeatured && item.isAvailable)
    .slice(0, 6);

  if (featuredItems.length === 0) return null;

  return (
    <section className="py-20 bg-white">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                {item.image && (
                  <div className="h-64 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[var(--color-secondary)]">
                      ${item.price.toFixed(2)}
                    </span>
                    {item.dietary.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.dietary.slice(0, 2).map((diet) => (
                          <span
                            key={diet}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                          >
                            {diet}
                          </span>
                        ))}
                      </div>
                    )}
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
            href="/menu"
            className="inline-block bg-[var(--color-primary)] text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
          >
            View Full Menu
          </Link>
        </motion.div>
      </div>
    </section>
  );
};


