import React from 'react';
import Link from 'next/link';
import { useCMS } from '../../contexts/CMSContext';
import { Star } from 'lucide-react';

// Google icon component
const Google = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const Footer = () => {
  const { footerColumns, siteConfig, locations, restaurant, reviews } = useCMS();

  const primaryLocation = (locations || []).find((loc) => loc.isPrimary && loc.isActive) || (locations || [])[0];
  const isDark = siteConfig?.theme?.footerStyle === 'dark';

  // Choose logo based on theme
  const logo = isDark ? restaurant?.branding?.logoDark : restaurant?.branding?.logoLight;
  const fallbackLogo = restaurant?.branding?.logo;
  const displayLogo = logo || fallbackLogo;

  // Check for Google reviews
  const hasGoogleReviews = siteConfig?.googleReviews?.placeId && siteConfig?.googleReviews?.averageRating;
  const googleReviews = hasGoogleReviews ? siteConfig.googleReviews : null;

  return (
    <footer className={`${isDark ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div>
            <Link href="/" className="flex items-center space-x-3 mb-6 group">
              {displayLogo && (
                <img 
                  src={displayLogo} 
                  alt={restaurant?.name || 'Restaurant'} 
                  className="h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                />
              )}
              <h3
                className="text-xl font-bold transition-colors"
                style={{ fontFamily: 'var(--font-heading, inherit)' }}
              >
                {restaurant?.name || 'Restaurant'}
              </h3>
            </Link>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {siteConfig?.tagline}
            </p>
            
            {/* Google Reviews Display */}
            {googleReviews && siteConfig?.reviews?.enableFooter && (
              <div className={`flex items-center space-x-2 mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <Google size={16} />
                <span className="font-semibold">{googleReviews.averageRating.toFixed(1)}</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < Math.floor(googleReviews.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-400'}
                    />
                  ))}
                </div>
                {googleReviews.totalReviews && (
                  <span className="text-sm">({googleReviews.totalReviews} reviews)</span>
                )}
              </div>
            )}
            
            {siteConfig?.social?.showInFooter !== false && (
              <div className="flex space-x-4">
                {siteConfig?.social?.facebook && (
                  <a
                    href={siteConfig?.social?.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      isDark ? 'hover:text-[var(--color-secondary)]' : 'hover:text-[var(--color-accent)]'
                    } transition-colors`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </a>
                )}
                {siteConfig?.social?.instagram && (
                  <a
                    href={siteConfig?.social?.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      isDark ? 'hover:text-[var(--color-secondary)]' : 'hover:text-[var(--color-accent)]'
                    } transition-colors`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
                    </svg>
                  </a>
                )}
                {siteConfig?.social?.twitter && (
                  <a
                    href={siteConfig?.social?.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      isDark ? 'hover:text-[var(--color-secondary)]' : 'hover:text-[var(--color-accent)]'
                    } transition-colors`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Footer Columns */}
          {(footerColumns || [])
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((column) => (
              <div key={column.id}>
                <h4 className="font-semibold mb-4">{column.title}</h4>
                <ul className="space-y-2">
                  {(column.links || []).map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.url || '#'}
                        className={`text-sm ${
                          isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                        } transition-colors`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          {/* Contact Column */}
          {primaryLocation && (
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start space-x-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-1 flex-shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    {typeof primaryLocation.address?.street === 'string' ? primaryLocation.address.street : ''}, 
                    {typeof primaryLocation.address?.city === 'string' ? primaryLocation.address.city : ''}, 
                    {typeof primaryLocation.address?.state === 'string' ? primaryLocation.address.state : ''}{' '}
                    {typeof primaryLocation.address?.zipCode === 'string' ? primaryLocation.address.zipCode : ''}
                  </span>
                </li>
                {typeof primaryLocation.phone === 'string' && primaryLocation.phone && (
                  <li className="flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <a
                      href={`tel:${primaryLocation.phone}`}
                      className={`${
                        isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      } transition-colors`}
                    >
                      {primaryLocation.phone}
                    </a>
                  </li>
                )}
                {typeof primaryLocation.email === 'string' && primaryLocation.email && (
                  <li className="flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-10 5L2 7"/>
                    </svg>
                    <a
                      href={`mailto:${primaryLocation.email}`}
                      className={`${
                        isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      } transition-colors`}
                    >
                      {primaryLocation.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div
          className={`pt-8 border-t ${
            isDark ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-500'
          } text-center text-xs`}
        >
          <p>
            &copy; {new Date().getFullYear()} {restaurant?.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

