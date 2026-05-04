import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf } from 'lucide-react';
import { withSiteParam, getSiteId } from '../../../lib/links';

export const HeroSection = ({ title, subtitle, image, cta }) => {
  const router = useRouter();
  const siteId = getSiteId(router);
  
  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-[var(--color-accent)]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"></path>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"></rect>
        </svg>
      </div>

      {/* Decorative Leaf Icon */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="w-full h-full max-w-7xl mx-auto px-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square max-w-none opacity-[0.03] animate-pulse">
            <Leaf className="w-full h-full" strokeWidth={0.5} />
          </div>
        </div>
      </div>

      {/* Decorative Image (if available from CMS) */}
      {image && (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="w-full h-full max-w-7xl mx-auto px-6 relative">
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-1/3 aspect-[3/4] hidden lg:block overflow-hidden rounded-full">
              <img
                src={image}
                alt="Hero"
                className="w-full h-full object-cover animate-fade-in"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl space-y-12"
        >
          {/* Subtitle/Label */}
          {subtitle && (
            <div className="inline-flex items-center gap-4 text-[var(--color-primary)] font-sans text-[10px] font-bold tracking-[0.4em] uppercase">
              <span className="w-8 h-px bg-[var(--color-primary)]/30"></span>
              <span>{subtitle}</span>
            </div>
          )}

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-[var(--color-secondary)] leading-tight">
            {title}
          </h1>

          {/* Description (if available) */}
          {cta && cta.description && (
            <p className="max-w-xl text-lg md:text-xl text-[var(--color-secondary)]/50 leading-relaxed font-sans font-light">
              {cta.description}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-8 pt-4">
            {cta && cta.url && (
              <>
                {(cta.url || '').startsWith('http') ? (
                  <a
                    href={cta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[var(--color-secondary)] text-[var(--color-accent)] px-14 py-5 text-xs font-bold rounded-full shadow-xl shadow-[var(--color-primary)]/10 hover:bg-[var(--color-primary)] transition-all duration-700 inline-flex items-center gap-2"
                  >
                    {cta.text || 'EXPLORE MENU'}
                    <ArrowRight size={18} strokeWidth={1.5} />
                  </a>
                ) : (
                  <Link
                    href={withSiteParam(cta.url, siteId)}
                    className="bg-[var(--color-secondary)] text-[var(--color-accent)] px-14 py-5 text-xs font-bold rounded-full shadow-xl shadow-[var(--color-primary)]/10 hover:bg-[var(--color-primary)] transition-all duration-700 inline-flex items-center gap-2"
                  >
                    {cta.text || 'EXPLORE MENU'}
                    <ArrowRight size={18} strokeWidth={1.5} />
                  </Link>
                )}
                {cta.secondaryUrl && (
                  <Link
                    href={withSiteParam(cta.secondaryUrl, siteId)}
                    className="border border-[var(--color-secondary)] text-[var(--color-secondary)] px-12 py-5 text-xs font-bold rounded-full hover:bg-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-all duration-700"
                  >
                    {cta.secondaryText || 'OUR STORY'}
                  </Link>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Decorative Text */}
      <div className="absolute bottom-12 right-12 hidden lg:flex items-center gap-6 text-[var(--color-secondary)]/20">
        <span className="font-sans text-[9px] font-bold uppercase tracking-[0.6em] vertical-rl rotate-180">Established 2026</span>
        <div className="w-px h-24 bg-[var(--color-secondary)]/10"></div>
      </div>
    </section>
  );
};


