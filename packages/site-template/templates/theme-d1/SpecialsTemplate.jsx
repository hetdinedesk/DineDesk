import React from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { Clock, Tag, Calendar } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

const SPECIAL_IMAGE = 'https://images.unsplash.com/photo-1759283084358-0565ea8e2885?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5lJTIwcGFpcmluZyUyMGRpbm5lcnxlbnwxfHx8fDE3NzQ4NDc3ODh8MA&ixlib=rb-4.1.0&q=80&w=1080';
const SPECIAL_IMAGE_2 = 'https://images.unsplash.com/photo-1755811248324-3c9b7c8865fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwZm9vZCUyMHBsYXRpbmd8ZW58MXx8fHwxNzc0NzY0ODA5fDA&ixlib=rb-4.1.0&q=80&w=1080';

export default function SpecialsPage() {
  const { specials, shortcodes } = useCMS();

  const activeSpecials = specials.filter((special) => {
    if (!special.isActive) return false;
    const now = new Date();
    const validFrom = new Date(special.validFrom);
    const validUntil = new Date(special.validUntil);
    return now >= validFrom && now <= validUntil;
  });

  const upcomingSpecials = specials.filter((special) => {
    if (!special.isActive) return false;
    const now = new Date();
    const validFrom = new Date(special.validFrom);
    return now < validFrom;
  });

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <div className="bg-[var(--color-primary)] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading, inherit)' }}
          >
            Current Specials
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl"
          >
            Limited time offerings crafted by our chefs
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Active Specials */}
        {activeSpecials.length > 0 ? (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-8">
              Available Now
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {activeSpecials.map((special, index) => {
                const title = replaceShortcodes(special.title || '', shortcodes);
                const description = replaceShortcodes(special.description || '', shortcodes);
                
                return (
                  <motion.div
                    key={special.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative rounded-lg overflow-hidden shadow-xl ${
                      special.isHighlighted ? 'ring-4 ring-[var(--color-secondary)]' : ''
                    }`}
                  >
                    {/* Image */}
                    <div className="h-80 overflow-hidden">
                      <img
                        src={index % 2 === 0 ? SPECIAL_IMAGE : SPECIAL_IMAGE_2}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      {special.isHighlighted && (
                        <div className="inline-flex items-center space-x-1 bg-[var(--color-secondary)] px-3 py-1 rounded-full mb-3">
                          <Tag size={14} />
                          <span className="text-xs font-semibold">Featured Special</span>
                        </div>
                      )}
                      <h3 className="text-3xl font-bold mb-2">{title}</h3>
                      <p className="text-gray-200 mb-4">{description}</p>
                      
                      <div className="flex items-center justify-between">
                        {special.price && (
                          <div className="flex items-baseline space-x-2">
                            <span className="text-4xl font-bold text-[var(--color-secondary)]">
                              ${special.price.toFixed(2)}
                            </span>
                            {special.originalPrice && (
                              <span className="text-lg text-gray-300 line-through">
                                ${special.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-300 mt-4 space-x-4">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span>{new Date(special.validFrom).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          <span>Until {new Date(special.validUntil).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No active specials at the moment. Check back soon!
            </p>
          </div>
        )}

        {/* Upcoming Specials */}
        {upcomingSpecials.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-8">
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingSpecials.map((special, index) => {
                const title = replaceShortcodes(special.title || '', shortcodes);
                const description = replaceShortcodes(special.description || '', shortcodes);
                
                return (
                  <motion.div
                    key={special.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg overflow-hidden shadow-md border-2 border-dashed border-gray-300"
                  >
                    <div className="p-6">
                      <div className="inline-flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full mb-3">
                        <Calendar size={14} className="text-gray-600" />
                        <span className="text-xs font-semibold text-gray-600">
                          Starts {new Date(special.validFrom).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">
                        {title}
                      </h3>
                      <p className="text-gray-600 mb-4">{description}</p>
                      {special.price && (
                        <div className="text-2xl font-bold text-[var(--color-secondary)]">
                          ${special.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


