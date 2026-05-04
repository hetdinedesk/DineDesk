import React from 'react';
import { Sparkles, Gift, UtensilsCrossed, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { withSiteParam, getSiteId } from '../../../lib/links';

export default function PromoTilesSection({ promos = [], title, subtitle, shortcodes = {} }) {
  const router = useRouter();
  const siteId = getSiteId(router);
  if (!promos || promos.length === 0) return null;

  const replaceShortcodes = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    let result = text;
    Object.entries(shortcodes).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
    });
    return result;
  };

  // Icon mapping based on promo content
  const getIcon = (promo) => {
    const heading = (promo.heading || '').toLowerCase();
    if (heading.includes('reward') || heading.includes('loyalty') || heading.includes('gift') || heading.includes('membership')) {
      return Gift;
    }
    if (heading.includes('food') || heading.includes('breakfast') || heading.includes('meal') || heading.includes('deal') || heading.includes('workshop') || heading.includes('education')) {
      return UtensilsCrossed;
    }
    return Sparkles;
  };

  // Get category label from promo
  const getCategoryLabel = (promo) => {
    const heading = (promo.heading || '').toLowerCase();
    if (heading.includes('reward') || heading.includes('loyalty') || heading.includes('gift') || heading.includes('membership')) {
      return 'Membership';
    }
    if (heading.includes('workshop') || heading.includes('education')) {
      return 'Education';
    }
    return 'Special Release';
  };

  return (
    <section className="py-24 px-6 bg-[var(--color-accent)]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        {(title || subtitle) && (
          <div className="text-center mb-16">
            {title && (
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] mb-4" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                {replaceShortcodes(title)}
              </h2>
            )}
            {subtitle && (
              <p className="text-xl text-gray-600">
                {replaceShortcodes(subtitle)}
              </p>
            )}
          </div>
        )}

        {/* Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {promos.map((promo, index) => {
            const hasCta = promo.linkLabel && promo.linkUrl;
            const hasLink = promo.linkUrl;
            const Icon = getIcon(promo);
            const categoryLabel = getCategoryLabel(promo);

            const TileContent = (
              <>
                <div className="aspect-[5/4] overflow-hidden">
                  <img
                    src={promo.imageUrl}
                    alt={promo.heading || ''}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-[var(--color-secondary)]/10 group-hover:bg-transparent transition-colors duration-700"></div>
                </div>
                <div className="p-12 space-y-8">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-[9px] font-bold text-[var(--color-primary)] tracking-[0.3em] uppercase">
                      {categoryLabel}
                    </span>
                    <div className="w-10 h-10 bg-[var(--color-primary)]/5 rounded-full flex items-center justify-center">
                      <Icon className="text-[var(--color-primary)]" width={24} height={24} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-serif text-4xl text-[var(--color-secondary)] tracking-tight">
                      {replaceShortcodes(promo.heading)}
                    </h3>
                    <p className="font-sans text-[11px] font-medium text-[var(--color-secondary)]/40 leading-relaxed tracking-widest uppercase">
                      {replaceShortcodes(promo.subheading)}
                    </p>
                  </div>
                  {(hasCta || hasLink) && (
                    <button className="flex items-center gap-3 font-sans text-[9px] font-bold tracking-[0.25em] text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-all duration-500 uppercase group/btn">
                      {promo.linkLabel || 'LEARN MORE'}
                      <ArrowRight size={14} strokeWidth={2} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </>
            );

            return (
              <div
                key={promo.id || index}
                className="group relative bg-white overflow-hidden transition-all duration-1000 shadow-lg hover:shadow-xl"
              >
                {hasCta ? (
                  <Link
                    href={promo.isExternal ? promo.linkUrl : withSiteParam(promo.linkUrl, siteId)}
                    target={promo.isExternal ? '_blank' : '_self'}
                    rel={promo.isExternal ? 'noopener noreferrer' : undefined}
                    className="block"
                  >
                    {TileContent}
                  </Link>
                ) : hasLink ? (
                  <Link
                    href={promo.isExternal ? promo.linkUrl : withSiteParam(promo.linkUrl, siteId)}
                    target={promo.isExternal ? '_blank' : '_self'}
                    rel={promo.isExternal ? 'noopener noreferrer' : undefined}
                    className="block"
                  >
                    {TileContent}
                  </Link>
                ) : (
                  TileContent
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
