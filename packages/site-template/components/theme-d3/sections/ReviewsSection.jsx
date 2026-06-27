import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../../contexts/CMSContext';
import { Star, Quote, Heart } from 'lucide-react';
import Link from 'next/link';
import { replaceShortcodes } from '../../../lib/shortcodes';

export const ReviewsSection = ({ title, subtitle, content = {} }) => {
  const { reviews, siteConfig, shortcodes } = useCMS();
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const scrollContainerRef = useRef(null);

  // Read alternateStyles from CMS config
  const alternate = siteConfig?.reviews?.alternateStyles === true;

  // Auto-scroll effect for mobile
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isAutoScrolling) return;

    let scrollAmount = 0;
    const scrollSpeed = 1; // pixels per frame
    let animationFrameId;

    const scroll = () => {
      if (!isAutoScrolling) {
        animationFrameId = requestAnimationFrame(scroll);
        return;
      }

      scrollAmount += scrollSpeed;
      container.scrollLeft = scrollAmount;

      // Reset when reaching the end
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
        scrollAmount = 0;
        container.scrollLeft = 0;
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling]);

  // Stop auto-scroll on user interaction
  const handleUserInteraction = () => {
    setIsAutoScrolling(false);
  };

  // Resume auto-scroll after 5 seconds of no interaction
  useEffect(() => {
    let timeoutId;
    const resumeScroll = () => {
      setIsAutoScrolling(true);
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(resumeScroll, 5000);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('touchstart', resetTimer);
      container.addEventListener('mousedown', resetTimer);
    }

    return () => {
      clearTimeout(timeoutId);
      if (container) {
        container.removeEventListener('touchstart', resetTimer);
        container.removeEventListener('mousedown', resetTimer);
      }
    };
  }, []);
  
  // CMS configuration - check if reviews carousel should be shown
  const reviewsConfig = siteConfig?.reviews || {};
  const googleReviewsConfig = siteConfig?.googleReviews || {};
  const hasValidPlaceId = googleReviewsConfig?.placeId && googleReviewsConfig?.placeId.trim() !== '';
  // Reviews are in siteConfig.reviews.googleReviews or siteConfig.reviews.reviews
  const googleReviews = reviewsConfig?.googleReviews || [];
  const hasReviews = reviews.length > 0 || googleReviews.length > 0;
  // Carousel explicitly enabled means the CMS toggle is ON — trust it
  const carouselExplicitlyEnabled = reviewsConfig?.showReviewsCarousel === true;
  const isCarouselEnabled = carouselExplicitlyEnabled || (reviewsConfig?.showReviewsCarousel !== false && hasReviews);
  const showReviewsCarousel = isCarouselEnabled && (hasReviews || carouselExplicitlyEnabled);
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
  const activeReviews = uniqueReviews.sort((a, b) => {
    // Sort by date (most recent first)
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  // Truncate review text to a reasonable length
  const truncateReview = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

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

        {/* Reviews Grid - Desktop: Grid, Mobile: Horizontal Scroll */}
        <div 
          ref={scrollContainerRef}
          onTouchStart={handleUserInteraction}
          onMouseDown={handleUserInteraction}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:grid overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory md:snap-none scrollbar-hide"
          style={{ 
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(280px, 1fr)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {activeReviews.map((review, index) => (
            <motion.div
              key={review.id || `review-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group relative p-8 rounded-[32px] hover:bg-opacity-10 transition-all duration-700 snap-start shrink-0"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <Quote className="absolute top-6 right-6 w-12 h-12" style={{ color: 'var(--color-primary)', opacity: 0.2 }} />

              {/* Star Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    width={12}
                    height={12}
                    strokeWidth={2}
                    className={`${
                      i < review.rating
                        ? alternate
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-[var(--color-primary)] text-[var(--color-primary)]'
                        : alternate
                          ? 'text-amber-400/30'
                          : 'text-black/20'
                    }`}
                  />
                ))}
              </div>

              {/* Review Content - Truncated */}
              <p className="text-base font-serif italic leading-relaxed mb-8" style={{ color: textColor, opacity: 0.9 }}>
                "{truncateReview(review.content, 120)}"
              </p>
              
              {/* Author Info */}
              <div className="flex items-center gap-4 pt-6" style={{ borderTop: `1px solid ${alternate ? 'rgba(248, 246, 243, 0.1)' : 'rgba(44, 44, 44, 0.1)'}` }}>
                {getAuthorAvatar(review) ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden shadow-xl" style={{ border: alternate ? '2px solid rgba(251, 191, 36, 0.5)' : '2px solid var(--color-primary)', opacity: alternate ? 1 : 0.3 }}>
                    <img
                      src={getAuthorAvatar(review)}
                      alt={review.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: alternate ? 'rgba(251, 191, 36, 0.2)' : 'var(--color-primary)', opacity: alternate ? 1 : 0.2 }}>
                    <span className="font-bold text-lg" style={{ color: alternate ? '#fbbf24' : 'var(--color-primary)' }}>
                      {review.author?.charAt(0)?.toUpperCase() || 'G'}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-serif text-lg italic" style={{ color: textColor }}>{review.author}</h4>
                  <p className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] mt-1" style={{ color: alternate ? '#fbbf24' : 'var(--color-primary)' }}>
                    {getAuthorRole(review)}
                  </p>
                  <p className="text-[9px] font-sans mt-1" style={{ color: textColor, opacity: 0.6 }}>
                    {formatDate(review.date)}
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


