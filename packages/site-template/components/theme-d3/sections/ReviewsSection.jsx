import React from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../../contexts/CMSContext';
import { Star, Quote, Heart } from 'lucide-react';
import Link from 'next/link';
import { replaceShortcodes } from '../../../lib/shortcodes';

export const ReviewsSection = ({ title, subtitle, content = {} }) => {
  const { reviews, siteConfig, shortcodes } = useCMS();
  
  // Read alternateStyles from CMS config
  const alternate = siteConfig?.reviews?.alternateStyles === true;
  
  // Debug logging
  console.log('ReviewsSection props:', { title, alternate, content });
  console.log('ReviewsSection CMS data:', { reviewsCount: reviews?.length, siteConfigReviews: siteConfig?.reviews });

  // CMS configuration - check if reviews carousel should be shown
  const reviewsConfig = siteConfig?.reviews || {};
  const googleReviewsConfig = siteConfig?.googleReviews || {};
  const hasValidPlaceId = googleReviewsConfig?.placeId && googleReviewsConfig?.placeId.trim() !== '';
  // Reviews are in siteConfig.reviews.googleReviews or siteConfig.reviews.reviews
  const googleReviews = reviewsConfig?.googleReviews || [];
  const hasReviews = reviews.length > 0 || googleReviews.length > 0;
  // Check both the section content flag AND the siteConfig reviews setting
  const showReviewsCarousel = (content?.showGoogleReviews !== false || reviewsConfig?.showReviewsCarousel !== false) && hasValidPlaceId && hasReviews;
  // Use site config CTA first, then fallback to section content CTA
  const ctaConfig = reviewsConfig?.ctas?.[0] || content?.cta || null;

  // For reviews section, prioritize site config over section title to match CMS behavior
  const displayTitle = reviewsConfig?.carouselHeading || title || content?.heading || content?.carouselHeading;

  // Process site config subtitle through shortcodes
  const siteConfigSubtitle = reviewsConfig?.carouselSubHeading || '';
  const processedSiteConfigSubtitle = replaceShortcodes(siteConfigSubtitle, shortcodes);

  const displaySubtitle = processedSiteConfigSubtitle || subtitle || content?.subheading || content?.carouselSubHeading || content?.subtitle;

  // If no title and no subtitle provided, don't show the header section
  const showHeader = displayTitle || displaySubtitle;

  // If reviews carousel is not enabled, no valid place ID, or no reviews, don't show anything
  if (!showReviewsCarousel) return null;

  // The 'reviews' array from useCMS() already contains both CMS reviews and Google reviews
  // They are mapped in CMSContext.jsx from the API response
  // Just filter out any without content/author and deduplicate by ID
  const uniqueReviews = reviews
    .filter(review => review.content && review.author)
    .reduce((acc, review) => {
      // Deduplicate by ID or author+content combination
      const key = review.id || `${review.author}-${review.content?.substring(0, 20)}`;
      if (!acc.find(r => (r.id || `${r.author}-${r.content?.substring(0, 20)}`) === key)) {
        acc.push(review);
      }
      return acc;
    }, []);

  // For carousel, show all available unique reviews
  const activeReviews = uniqueReviews;

  if (activeReviews.length === 0) return null;

  // Helper function to format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recent'; // Invalid date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recent';
    }
  };

  // Generate review URL - returns null if no valid URL
  const getReviewUrl = () => {
    // First try the CTA URL from content (supports both url and value fields)
    if (ctaConfig?.url) return ctaConfig.url;
    if (ctaConfig?.value) return ctaConfig.value;
    const googleReviews = siteConfig?.googleReviews;
    if (googleReviews?.placeId) {
      return `https://search.google.com/local/writereview?placeid=${googleReviews.placeId}`;
    }
    return null; // No valid URL
  };

  const reviewUrl = getReviewUrl();
  const hasValidCtaUrl = reviewUrl && reviewUrl !== '#';

  // CTA styles
  const getCtaStyles = (variant) => {
    const baseStyles = 'inline-block font-medium px-6 py-3 rounded-lg transition-all duration-300';
    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90`;
      case 'secondary':
        return `${baseStyles} bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary)]/90`;
      case 'outline':
        return `${baseStyles} border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white`;
      default:
        return `${baseStyles} bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90`;
    }
  };

  // Get author role/title if available
  const getAuthorRole = (review) => {
    return review.role || review.title || review.platform || 'Customer';
  };

  // Get author avatar if available
  const getAuthorAvatar = (review) => {
    return review.avatar || review.imageUrl || review.profileImage || null;
  };
  
  // Default: white background, alternate: primary color background
  const bgColor = alternate ? 'var(--color-primary)' : '#ffffff';
  const textColor = alternate ? 'var(--color-accent)' : 'var(--color-secondary)';
  const cardBg = alternate ? 'rgba(248, 246, 243, 0.1)' : 'rgba(44, 44, 44, 0.03)';
  const cardBorder = alternate ? 'rgba(248, 246, 243, 0.2)' : 'rgba(44, 44, 44, 0.1)';

  return (
    <section className="py-32 px-6 overflow-hidden" style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24 space-y-6"
          >
            {reviewsConfig?.label && (
              <div className="inline-flex items-center justify-center gap-4 text-[var(--color-primary)] font-sans font-semibold uppercase tracking-[0.3em] text-[10px]">
                <Heart width={16} height={16} strokeWidth={2} fill="currentColor" />
                <span style={{ color: 'var(--color-primary)' }}>{reviewsConfig.label}</span>
              </div>
            )}
            {displayTitle && (
              <h2 className="font-serif text-6xl md:text-8xl leading-[0.9] tracking-tight">
                {displayTitle}
              </h2>
            )}
            {displaySubtitle && (
              <p className="text-xl" style={{ color: textColor, opacity: 0.8 }}>
                {displaySubtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {activeReviews.map((review, index) => (
            <motion.div
              key={review.id || `review-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-12 rounded-[40px] hover:bg-opacity-10 transition-all duration-700"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <Quote className="absolute top-10 right-10 w-16 h-16" style={{ color: 'var(--color-primary)', opacity: 0.2 }} />
              
              {/* Star Rating */}
              <div className="flex gap-1 mb-10">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    width={14}
                    height={14}
                    strokeWidth={2}
                    className={`${
                      i < review.rating
                        ? 'fill-[var(--color-primary)] text-[var(--color-primary)]'
                        : (alternate ? 'text-white/30' : 'text-black/20')
                    }`}
                  />
                ))}
              </div>
              
              {/* Review Content */}
              <p className="text-xl font-serif italic leading-relaxed mb-12" style={{ color: textColor, opacity: 0.9 }}>
                "{review.content}"
              </p>
              
              {/* Author Info */}
              <div className="flex items-center gap-6 pt-10" style={{ borderTop: `1px solid ${alternate ? 'rgba(248, 246, 243, 0.1)' : 'rgba(44, 44, 44, 0.1)'}` }}>
                {getAuthorAvatar(review) ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl" style={{ border: `2px solid var(--color-primary)`, opacity: 0.3 }}>
                    <img
                      src={getAuthorAvatar(review)}
                      alt={review.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.2 }}>
                    <span className="font-bold text-xl" style={{ color: 'var(--color-primary)' }}>
                      {review.author?.charAt(0)?.toUpperCase() || 'G'}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-serif text-2xl italic" style={{ color: textColor }}>{review.author}</h4>
                  <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] mt-1" style={{ color: 'var(--color-primary)' }}>
                    {getAuthorRole(review)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section - only show if there's a valid URL */}
        {ctaConfig && (ctaConfig.active !== false) && ctaConfig?.label && hasValidCtaUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={getCtaStyles(ctaConfig?.variant || ctaConfig?.variantType || 'primary')}
            >
              {ctaConfig.label}
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
};


