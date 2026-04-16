import React from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../../contexts/CMSContext';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { replaceShortcodes } from '../../../lib/shortcodes';

export const ReviewsSection = ({ title, subtitle, content = {} }) => {
  const { reviews, siteConfig, shortcodes } = useCMS();

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

  // Get all reviews - both CMS reviews and Google reviews for carousel
  const cmsReviews = reviews.filter((review) => review.isActive);
  // Google reviews are in siteConfig.reviews.googleReviews or siteConfig.reviews.reviews
  const googleReviewsData = googleReviews || reviewsConfig?.reviews || [];
  
  // Combine both types of reviews
  const allReviews = [
    ...cmsReviews.map(review => ({
      ...review,
      source: review.platform || 'CMS'
    })),
    ...googleReviewsData.map((review, idx) => ({
      id: review.id || `google-${idx}`,
      author: review.name || review.author || 'Google User',
      rating: review.stars || review.rating || 5,
      content: review.text || review.content || 'Great experience!',
      date: review.date || new Date().toISOString(),
      platform: 'Google',
      source: 'Google'
    }))
  ];
  
  // For carousel, show all available reviews (no artificial limit)
  const activeReviews = allReviews.length > 0 ? allReviews : [];

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

  // Generate review URL
  const getReviewUrl = () => {
    // First try the CTA URL from content (supports both url and value fields)
    if (ctaConfig?.url) return ctaConfig.url;
    if (ctaConfig?.value) return ctaConfig.value;
    const googleReviews = siteConfig?.googleReviews;
    if (googleReviews?.placeId) {
      return `https://search.google.com/local/writereview?placeid=${googleReviews.placeId}`;
    }
    return '#';
  };

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

  // Check if we should use alternate styling
  const useAlternateStyles = content?.alternateStyle || siteConfig?.reviews?.alternateStyles;
  
  return (
    <section className={`py-20 ${useAlternateStyles ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - Only show if title or subtitle provided */}
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            {displayTitle && (
              <h2
                className={`text-4xl md:text-5xl font-bold mb-4 ${
                  useAlternateStyles ? 'text-white' : 'text-[var(--color-primary)]'
                }`}
                style={{ fontFamily: 'var(--font-heading, inherit)' }}
              >
                {displayTitle}
              </h2>
            )}
            {displaySubtitle && (
              <p className={`text-xl ${
                useAlternateStyles ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {displaySubtitle}
              </p>
            )}
            {/* Content box under subheading */}
            {siteConfig?.reviews?.carouselContent && (
              <p className={`text-lg mt-4 ${
                useAlternateStyles ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {siteConfig.reviews.carouselContent}
              </p>
            )}
          </motion.div>
        )}

        {/* Auto-scrolling Carousel */}
        <div className="relative overflow-hidden">
          <div 
            className="flex animate-scroll space-x-8"
          >
            {/* Duplicate reviews for seamless scrolling */}
            {[...activeReviews, ...activeReviews].map((review, index) => (
              <motion.div
                key={`${review.id || `review-${index}`}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % activeReviews.length) * 0.1 }}
                className={`flex-shrink-0 w-80 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300 ${
                  useAlternateStyles ? 'bg-gray-800' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={`${
                        i < review.rating 
                          ? (useAlternateStyles ? 'text-yellow-400 fill-current' : 'text-[var(--color-secondary)] fill-current')
                          : (useAlternateStyles ? 'text-gray-600' : 'text-gray-300')
                      }`}
                    />
                  ))}
                </div>
                <p className={`mb-4 italic ${
                  useAlternateStyles ? 'text-gray-300' : 'text-gray-700'
                }`}>"{review.content}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${
                    useAlternateStyles ? 'text-white' : 'text-[var(--color-primary)]'
                  }`}>{review.author}</p>
                  <p className={`text-sm ${
                    useAlternateStyles ? 'text-gray-400' : 'text-gray-500'
                  }`}>{formatDate(review.date)}</p>
                  </div>
                  {review.platform && (
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      useAlternateStyles 
                        ? 'bg-gray-700 text-gray-300 border-gray-600' 
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}>
                      {review.platform}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {ctaConfig && (ctaConfig.active !== false) && ctaConfig?.label && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <a
              href={getReviewUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={getCtaStyles(ctaConfig?.variant || ctaConfig?.variantType || 'primary')}
            >
              {ctaConfig.label}
            </a>
          </motion.div>
        )}
      </div>

      {/* Custom CSS for auto-scrolling */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};


