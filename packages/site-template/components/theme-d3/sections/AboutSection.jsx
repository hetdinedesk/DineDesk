import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Sprout, Flower2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { withSiteParam, getSiteId } from '../../../lib/links';

export const AboutSection = ({ title, subtitle, content, cta }) => {
  const router = useRouter();
  const siteId = getSiteId(router);
  
  return (
    <section className="py-32 px-6 bg-[var(--color-accent)] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="relative aspect-[4/5] z-10 overflow-hidden rounded-[40px] shadow-xl">
              {content?.image && (
                <img
                  src={content.image}
                  alt={title || 'About'}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-[var(--color-primary)]/10 mix-blend-multiply"></div>
            </div>
            
            {/* Decorative Badge */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[var(--color-primary)] text-[var(--color-accent)] p-8 rounded-full flex flex-col items-center justify-center text-center shadow-xl z-20 hidden md:flex animate-pulse">
              <Sprout width={32} height={32} strokeWidth={2} className="mb-2" />
              <div className="font-serif italic text-2xl leading-none">100%</div>
              <div className="font-sans text-[8px] tracking-[0.2em] uppercase opacity-80 mt-1">Organic Roots</div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -z-10"></div>
            <div className="absolute top-40 -right-10 w-40 h-40 border border-[var(--color-primary)]/20 rounded-full -z-10"></div>
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            {/* Label */}
            <div className="inline-flex items-center gap-4 text-[var(--color-primary)] font-sans font-semibold uppercase tracking-[0.3em] text-[10px]">
              <Leaf width={16} height={16} strokeWidth={2} />
              <span>Our Philosophy</span>
            </div>

            {/* Title */}
            <h2 className="font-serif text-6xl md:text-8xl text-[var(--color-secondary)] leading-[0.9] tracking-tight">
              {title}
            </h2>

            {/* Subtitle/Description */}
            {subtitle && (
              <p className="text-xl text-[var(--color-secondary)]/70 leading-relaxed font-sans font-light">
                {subtitle}
              </p>
            )}

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-10 border-t border-[var(--color-secondary)]/5">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center text-[var(--color-primary)]">
                  <Flower2 width={24} height={24} strokeWidth={2} />
                </div>
                <h4 className="font-serif text-2xl text-[var(--color-secondary)] italic">Ethical Harvest</h4>
                <p className="text-[var(--color-secondary)]/60 text-sm font-sans leading-relaxed">
                  Direct trade partnerships that ensure every farmer is honored for their craft and dedication.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center text-[var(--color-primary)]">
                  <Leaf width={24} height={24} strokeWidth={2} />
                </div>
                <h4 className="font-serif text-2xl text-[var(--color-secondary)] italic">Zero Waste Path</h4>
                <p className="text-[var(--color-secondary)]/60 text-sm font-sans leading-relaxed">
                  From compostable packaging to our closed-loop brewing systems, we tread lightly on our planet.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            {cta && cta.url && (
              <Link
                href={cta.isExternal ? cta.url : withSiteParam(cta.url, siteId)}
                target={cta.isExternal ? '_blank' : '_self'}
                rel={cta.isExternal ? 'noopener noreferrer' : undefined}
                className="bg-[var(--color-primary)] text-[var(--color-accent)] px-8 py-4 rounded-full font-bold inline-flex items-center gap-2 hover:bg-[var(--color-secondary)] transition-all duration-700 group"
              >
                {cta.text || 'THE FULL STORY'}
                <ArrowRight width={20} height={20} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};


