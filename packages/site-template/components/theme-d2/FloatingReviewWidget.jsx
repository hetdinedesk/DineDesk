import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import { Star } from 'lucide-react';

// Google icon component
const Google = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const FloatingReviewWidget = () => {
  const { siteConfig } = useCMS();
  const [isVisible, setIsVisible] = useState(true);

  // Check if Google reviews are available
  const googleReviews = siteConfig?.googleReviews;
  if (!googleReviews?.placeId || !googleReviews?.averageRating) {
    return null;
  }

  // Check if widget should be shown
  if (!siteConfig?.reviews?.enableFloating || !googleReviews?.showFloatingWidget) {
    return null;
  }

  // Handle close button
  const handleClose = () => {
    setIsVisible(false);
  };

  // Generate Google Maps review URL
  const getReviewUrl = () => {
    if (!googleReviews.placeId) return '#';
    return `https://search.google.com/local/writereview?placeid=${googleReviews.placeId}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-full shadow-lg border border-gray-200 p-3 flex items-center space-x-2 hover:shadow-xl transition-shadow duration-300">
      {/* Google Icon */}
      <Google size={20} className="text-blue-600" />
      
      {/* Rating */}
      <div className="flex items-center space-x-1">
        <span className="font-bold text-sm text-gray-900">
          {googleReviews.averageRating.toFixed(1)}
        </span>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < Math.floor(googleReviews.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
            />
          ))}
        </div>
      </div>
      
      {/* Review Count */}
      <span className="text-xs text-gray-600">
        ({googleReviews.totalReviews || 0})
      </span>
      
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close review widget"
      >
        <X size={14} />
      </button>
      
      {/* Review Link */}
      <a
        href={getReviewUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 rounded-full"
        aria-label="Write a review"
      />
    </div>
  );
};
