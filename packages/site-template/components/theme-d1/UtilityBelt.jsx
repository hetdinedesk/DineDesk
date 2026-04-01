import React from 'react';
import Link from 'next/link';
import { useCMS } from '../../contexts/CMSContext';

// Clean SVG icons matching footer style
const Phone = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const MapPin = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const Star = ({ size = 12, fill = "currentColor", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// Social icons matching footer style
const Facebook = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const Instagram = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
  </svg>
);

const Twitter = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Google icon
const Google = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const SocialIcon = ({ platform, size = 16 }) => {
  if (!platform || typeof platform !== 'string') return null;
  
  switch (platform.toLowerCase()) {
    case 'facebook': return <Facebook size={size} />;
    case 'instagram': return <Instagram size={size} />;
    case 'twitter': return <Twitter size={size} />;
    default: return null;
  }
};

export const UtilityBelt = ({ isDark }) => {
  const { 
    locations, 
    siteConfig, 
    reviews, 
    headerCtas, 
    rawHeader,
    restaurant,
    rawBooking: booking
  } = useCMS();

  if (!siteConfig?.theme?.utilityBelt) return null;

  const primaryLocation = locations.find(l => l.isPrimary) || locations[0];
  const utilityItems = rawHeader?.utilityItems || {};
  const rawOrder = utilityItems.order || ['contact-info', 'social-links', 'reviews', 'header-ctas'];
  const order = Array.isArray(rawOrder) ? rawOrder : ['contact-info', 'social-links', 'reviews', 'header-ctas'];

  // Helper function to create Google Maps directions URL
  const getDirectionsUrl = (location) => {
    if (!location) return '#';
    
    const address = [
      location.address?.street,
      location.address?.suburb,
      location.address?.state,
      location.address?.postcode
    ].filter(Boolean).join(', ');
    
    const query = encodeURIComponent(address || location.name || 'Restaurant');
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const renderItem = (key) => {
    if (utilityItems[key] === false) return null;

    switch (key) {
      case 'contact-info':
        return (
          <div key={key} className="flex items-center space-x-4 text-xs font-medium">
            {primaryLocation?.phone && (
              <a href={`tel:${primaryLocation.phone}`} className="flex items-center hover:opacity-80 transition-opacity">
                <Phone size={14} className="mr-1" />
                <span>{primaryLocation.phone}</span>
              </a>
            )}
            {primaryLocation?.address?.street && (
              <a 
                href={getDirectionsUrl(primaryLocation)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden sm:flex items-center hover:opacity-80 transition-opacity"
              >
                <MapPin size={14} className="mr-1" />
                <span>{primaryLocation.address.street}</span>
              </a>
            )}
          </div>
        );

      case 'social-links':
        const activeSocials = Object.entries(siteConfig.social || {})
          .filter(([platform, url]) => url && typeof url === 'string' && platform !== 'showInFooter' && platform !== 'showInUtility');
        
        if (activeSocials.length === 0) return null;

        return (
          <div key={key} className="flex items-center space-x-3">
            {activeSocials.map(([platform, url]) => (
              <a 
                key={platform} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <SocialIcon platform={platform} />
              </a>
            ))}
          </div>
        );

      case 'reviews':
        // Check if reviews are enabled globally and in header
        if (siteConfig?.features?.showReviews && siteConfig?.reviews?.enableHeader && 
            siteConfig?.googleReviews?.placeId && siteConfig?.googleReviews?.averageRating) {
          const { averageRating, totalReviews } = siteConfig.googleReviews;
          return (
            <div key={key} className="flex items-center space-x-1 text-xs font-medium">
              <Google size={14} />
              <span className="font-bold">{averageRating.toFixed(1)}</span>
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} fill={i < Math.floor(averageRating) ? 'currentColor' : 'none'} />
                ))}
              </div>
              {totalReviews && (
                <span className="hidden xs:inline text-gray-300">({totalReviews})</span>
              )}
            </div>
          );
        }
        return null;
        // Fallback to regular reviews
        if (!reviews || reviews.length === 0) return null;
        const avgRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;
        
        return (
          <div key={key} className="flex items-center space-x-1 text-xs font-medium">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} fill={i < Math.floor(avgRating) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <span className="hidden xs:inline">{avgRating.toFixed(1)} Google Reviews</span>
          </div>
        );

      case 'header-ctas':
        const activeCtas = (headerCtas || []).filter(cta => cta.active);
        if (activeCtas.length === 0) return null;

        return (
          <div key={key} className="flex items-center space-x-2">
            {activeCtas.map(cta => {
              const variantStyles = {
                primary: isDark ? 'bg-white text-gray-900 px-3 py-1 rounded shadow-sm' : 'bg-white text-[var(--color-primary)] px-3 py-1 rounded shadow-sm',
                secondary: 'bg-[var(--color-secondary)] text-white px-3 py-1 rounded shadow-sm',
                outline: 'border border-white text-white px-3 py-1 rounded hover:bg-white hover:text-[var(--color-primary)]',
                text: 'text-white hover:underline px-2 py-1',
              };
              
              const style = variantStyles[cta.variant] || variantStyles.primary;

              return (
                <React.Fragment key={cta.id}>
                  {(cta.value || '').startsWith('http') ? (
                    <a 
                      href={cta.value || '#'} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-bold transition-all ${style}`}
                    >
                      {cta.label}
                    </a>
                  ) : (
                    <Link 
                      href={cta.value || '#'} 
                      className={`text-xs font-bold transition-all ${style}`}
                    >
                      {cta.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="w-full py-2 px-4 sm:px-6 lg:px-8 text-white z-[60]"
      style={{ 
        backgroundColor: isDark ? '#000000' : 'var(--color-secondary)',
        fontFamily: 'var(--font-heading, inherit)'
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between sm:gap-6">
        {/* Left side: Contact & Reviews */}
        <div className="flex items-center gap-6">
          {order.filter(k => k === 'contact-info' || k === 'reviews').map(key => renderItem(key))}
        </div>

        {/* Right side: Social & CTAs */}
        <div className="flex items-center gap-6">
          {order.filter(k => ['social-links', 'header-ctas'].includes(k)).map(key => renderItem(key))}
        </div>
      </div>
    </div>
  );
};


