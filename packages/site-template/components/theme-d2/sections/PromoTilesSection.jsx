import React from 'react';
import { Sparkles, Gift, UtensilsCrossed } from 'lucide-react';
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
    if (heading.includes('reward') || heading.includes('loyalty') || heading.includes('gift')) {
      return Gift;
    }
    if (heading.includes('food') || heading.includes('breakfast') || heading.includes('meal') || heading.includes('deal')) {
      return UtensilsCrossed;
    }
    return Sparkles;
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

            const TileContent = (
              <>
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={promo.imageUrl}
                    alt={promo.heading || ''}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-[var(--color-secondary)]/20 group-hover:bg-[var(--color-secondary)]/0 transition-colors duration-500"></div>
                </div>
                <div className="p-8 relative">
                  <div className="absolute -top-10 left-8 w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center transition-transform duration-500 group-hover:-translate-y-2">
                    <Icon className="text-[var(--color-primary)]" width={24} height={24} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[var(--color-secondary)] mt-4 mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                    {replaceShortcodes(promo.heading)}
                  </h3>
                  <p className="text-gray-600/60 leading-relaxed">
                    {replaceShortcodes(promo.subheading)}
                  </p>
                </div>
              </>
            );

            return (
              <div
                key={promo.id || index}
                className="group relative overflow-hidden rounded-3xl bg-white border border-[var(--color-primary)]/20 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
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
