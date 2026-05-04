import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useCMS } from '../../../contexts/CMSContext';
import { Clock, Tag, Sparkles, ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { withSiteParam, getSiteId } from '../../../lib/links';

export const SpecialsSection = ({ title, subtitle }) => {
  const { specials } = useCMS();
  const router = useRouter();
  const siteId = getSiteId(router);

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
    <section className="py-32 px-6 bg-[var(--color-accent)]/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-4 text-[var(--color-primary)] font-sans font-semibold uppercase tracking-[0.3em] text-[10px]">
              <Sparkles width={16} height={16} strokeWidth={2} />
              <span>Curated Selection</span>
            </div>
            <h2 className="font-serif text-6xl md:text-8xl text-[var(--color-secondary)] leading-[0.9] tracking-tight">
              {title}
            </h2>
          </div>
          <div className="flex gap-4">
            <button className="w-14 h-14 rounded-full border border-[var(--color-secondary)]/10 flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-[var(--color-accent)] hover:border-[var(--color-primary)] transition-all duration-500">
              <ArrowLeft width={20} height={20} strokeWidth={2} />
            </button>
            <button className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-[var(--color-accent)] flex items-center justify-center hover:bg-[var(--color-secondary)] transition-all duration-500 shadow-xl">
              <ArrowRight width={20} height={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Specials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {activeSpecials.map((special, index) => (
            <motion.div
              key={special.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-[var(--color-accent)] rounded-[32px] overflow-hidden shadow-xl transition-all duration-700 hover:-translate-y-2"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                {special.image && (
                  <img
                    src={special.image}
                    alt={special.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                )}
                {special.isHighlighted && (
                  <div className="absolute top-6 left-6 px-4 py-2 bg-[var(--color-accent)]/90 backdrop-blur-md text-[var(--color-primary)] text-[10px] font-sans font-bold uppercase tracking-widest rounded-full">
                    SEASONAL BLOOM
                  </div>
                )}
                <button className="absolute bottom-6 right-6 w-12 h-12 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors duration-300">
                  <Heart width={20} height={20} strokeWidth={2} />
                </button>
              </div>
              <div className="p-10 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-serif text-3xl text-[var(--color-secondary)] italic">
                    {special.title}
                  </h3>
                  {special.price && (
                    <span className="text-[var(--color-primary)] font-serif text-2xl">
                      ${special.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="font-sans text-sm text-[var(--color-secondary)]/60 leading-relaxed">
                  {special.description}
                </p>
                <button className="w-full py-4 border border-[var(--color-primary)]/20 text-[var(--color-primary)] font-sans font-bold text-[10px] tracking-widest rounded-full hover:bg-[var(--color-primary)] hover:text-[var(--color-accent)] transition-all duration-500 uppercase">
                  ADD TO BASKET
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href={withSiteParam('/specials', siteId)}
            className="inline-block bg-[var(--color-primary)] text-[var(--color-accent)] px-8 py-4 rounded-full font-bold hover:bg-[var(--color-secondary)] transition-all duration-700"
          >
            View All Specials
          </Link>
        </motion.div>
      </div>
    </section>
  );
};


