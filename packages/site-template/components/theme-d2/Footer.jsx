import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCMS } from '../../contexts/CMSContext';
import { withSiteParam, getSiteId } from '../../lib/links';
import { Coffee } from 'lucide-react';

export const Footer = () => {
  const { footerColumns, unassignedFooterLinks, siteConfig, locations, restaurant, rawData } = useCMS();
  const router = useRouter();
  const siteId = getSiteId(router) || rawData?.client?.id || '';

  const primaryLocation = (locations || []).find((loc) => loc.isPrimary && loc.isActive) || (locations || [])[0];
  const footerLocations = (locations || []).filter((loc) => loc.showInFooter && loc.isActive);
  const isDark = siteConfig?.theme?.footerStyle === 'dark';

  // Choose logo based on theme
  const logo = isDark ? restaurant?.branding?.logoDark : restaurant?.branding?.logoLight;
  const fallbackLogo = restaurant?.branding?.logo;
  const displayLogo = logo || fallbackLogo;

  // Use only CMS-configured footer columns (not auto-generated from navbar)
  const allColumns = (footerColumns || [])
    .filter(col => col.isActive !== false && (col.links || []).length > 0);

  return (
    <footer className="bg-[var(--color-secondary)] text-[var(--color-accent)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Row 1: Brand and Dynamic Columns */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-8 mb-8">
          {/* Brand */}
          <div className="lg:w-1/4">
            <Link href={withSiteParam('/', siteId)} className="flex items-center space-x-3 mb-4 group">
              {displayLogo ? (
                <img 
                  src={displayLogo} 
                  alt={restaurant?.name || 'Restaurant'} 
                  className="h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-10 h-10 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white group-hover:bg-[var(--color-accent)] transition-colors">
                  <Coffee width={20} height={20} />
                </div>
              )}
              <h3
                className="text-xl font-bold transition-colors font-serif"
                style={{ fontFamily: 'var(--font-heading, inherit)' }}
              >
                {restaurant?.name ? (
                  <>
                    {restaurant.name.split(' ').slice(0, -1).join(' ')} <span className="text-[var(--color-primary)]">{restaurant.name.split(' ').slice(-1)}</span>
                  </>
                ) : (
                  <>BEANS & <span className="text-[var(--color-primary)]">BARISTAS</span></>
                )}
              </h3>
            </Link>
            <p className="text-sm text-[var(--color-accent)]/70">
              {siteConfig?.tagline}
            </p>
          </div>

          {/* Dynamic Columns - Horizontal on desktop */}
          <div className="lg:w-3/4">
            <div className="flex flex-wrap gap-8 lg:gap-12">
              {allColumns.length === 0 && (!unassignedFooterLinks || unassignedFooterLinks.length === 0) ? (
                <div className="text-sm text-[var(--color-accent)]/50">
                  No footer links configured yet.
                </div>
              ) : (
                <>
                  {allColumns.map((column) => (
                    <div key={column.id} className="min-w-[140px]">
                      <h4 className="font-semibold mb-3 text-[var(--color-primary)]">{column.title}</h4>
                      <ul className="space-y-1.5">
                        {(column.links || []).map((link, index) => (
                          <li key={index}>
                            <Link
                              href={withSiteParam(link.url || '#', siteId)}
                              className="text-sm text-[var(--color-accent)]/70 hover:text-[var(--color-accent)] transition-colors"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {unassignedFooterLinks && unassignedFooterLinks.length > 0 && (
                    <div className="min-w-[140px]">
                      <h4 className="font-semibold mb-3 text-[var(--color-primary)]">Pages</h4>
                      <ul className="space-y-1.5">
                        {unassignedFooterLinks.map((link, index) => (
                          <li key={index}>
                            <Link
                              href={withSiteParam(link.url || '#', siteId)}
                              className="text-sm text-[var(--color-accent)]/70 hover:text-[var(--color-accent)] transition-colors"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Contact Locations */}
        {footerLocations.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3 border-t pt-6 lg:pt-0 lg:border-t-0 border-[var(--color-accent)]/20 text-[var(--color-primary)]">Contact</h4>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {footerLocations.map((loc) => (
                <div key={loc.id} className="space-y-1 min-w-[200px] max-w-[280px]">
                  <h5 className="font-medium text-sm text-[var(--color-accent)]">
                    {loc.name}
                  </h5>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-start space-x-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 flex-shrink-0 text-[var(--color-primary)]">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className="text-[var(--color-accent)]/70 text-xs leading-relaxed">
                        {loc.address?.street ? loc.address.street + ', ' : ''}
                        {loc.address?.suburb ? loc.address.suburb + ', ' : ''}
                        {loc.address?.city ? loc.address.city + ', ' : ''}
                        {loc.address?.state || ''}{' '}
                        {loc.address?.zipCode || ''}
                      </span>
                    </li>
                    {loc.phone && (
                      <li className="flex items-center space-x-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-[var(--color-primary)]">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <a
                          href={`tel:${loc.phone}`}
                          className="text-[var(--color-accent)]/70 hover:text-[var(--color-accent)] transition-colors text-xs"
                        >
                          {loc.phone}
                        </a>
                      </li>
                    )}
                    {loc.email && (
                      <li className="flex items-center space-x-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-[var(--color-primary)]">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="m22 7-10 5L2 7"/>
                        </svg>
                        <a
                          href={`mailto:${loc.email}`}
                          className="text-[var(--color-accent)]/70 hover:text-[var(--color-accent)] transition-colors text-xs"
                        >
                          {loc.email}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="pt-6 border-t border-[var(--color-accent)]/20 text-center text-xs text-[var(--color-accent)]/50"
        >
          <p className="mb-1">
            &copy; {new Date().getFullYear()} {restaurant?.name}. All rights reserved.
          </p>
          <p className="text-[var(--color-accent)]/30">
            Designed by DineDesk
          </p>
        </div>
      </div>
    </footer>
  );
};

