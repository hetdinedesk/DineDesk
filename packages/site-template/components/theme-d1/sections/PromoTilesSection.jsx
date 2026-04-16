import React from 'react';
import { ArrowRight } from 'lucide-react';
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

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gray-50">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {promos.map((promo, index) => (
            <div
              key={promo.id || index}
              className="group bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              {/* Image */}
              {promo.imageUrl && (
                <div className="h-64 overflow-hidden">
                  <img
                    src={promo.imageUrl}
                    alt={promo.heading || ''}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {promo.heading && (
                  <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-2">
                    {promo.linkUrl ? (
                      <Link
                        href={promo.isExternal ? promo.linkUrl : withSiteParam(promo.linkUrl, siteId)}
                        target={promo.isExternal ? '_blank' : '_self'}
                        rel={promo.isExternal ? 'noopener noreferrer' : undefined}
                        className="hover:opacity-80 transition-opacity"
                      >
                        {replaceShortcodes(promo.heading)}
                      </Link>
                    ) : (
                      replaceShortcodes(promo.heading)
                    )}
                  </h3>
                )}
                {promo.subheading && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {replaceShortcodes(promo.subheading)}
                  </p>
                )}
                
                {/* CTA Button */}
                {promo.linkLabel && promo.linkUrl ? (
                  <Link
                    href={promo.isExternal ? promo.linkUrl : withSiteParam(promo.linkUrl, siteId)}
                    target={promo.isExternal ? '_blank' : '_self'}
                    rel={promo.isExternal ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                  >
                    {replaceShortcodes(promo.linkLabel)}
                    <ArrowRight size={16} />
                  </Link>
                ) : null}
              </div>

              {/* Full tile link if no CTA */}
              {!promo.linkLabel && promo.linkUrl && (
                <Link
                  href={promo.isExternal ? promo.linkUrl : withSiteParam(promo.linkUrl, siteId)}
                  target={promo.isExternal ? '_blank' : '_self'}
                  rel={promo.isExternal ? 'noopener noreferrer' : undefined}
                  className="absolute inset-0"
                  aria-label={promo.heading || 'Promo tile'}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
