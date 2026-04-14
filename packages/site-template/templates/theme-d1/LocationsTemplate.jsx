import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { MapPin, Phone, Mail, Clock, Navigation, UtensilsCrossed, ChevronLeft, ChevronRight } from 'lucide-react';

// Format 24-hour time (0900, 1730) to readable 12-hour format (9:00 AM, 5:30 PM)
function formatTime(timeStr) {
  if (!timeStr) return '';
  // Remove any non-numeric characters
  const clean = timeStr.replace(/[^0-9]/g, '');
  if (clean.length < 3 || clean.length > 4) return timeStr;
  
  const hours = parseInt(clean.slice(0, 2), 10);
  const minutes = clean.slice(2, 4) || '00';
  
  if (isNaN(hours) || hours > 23) return timeStr;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes === '00' ? '' : `:${minutes}`;
  
  return `${displayHours}${displayMinutes} ${period}`;
}

export default function LocationsPage({ data, page, banner }) {
  const { locations, rawSettings } = useCMS();

  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Start as false since SSR provides data immediately
  const [isLoading, setIsLoading] = useState(false);

  // Get locations from CMS
  const activeLocations = locations?.filter((loc) => loc.isActive) || [];
  const primaryLocationIndex = activeLocations.findIndex((loc) => loc.isPrimary);
  const initialIndex = primaryLocationIndex >= 0 ? primaryLocationIndex : 0;
  
  useEffect(() => {
    // Only set loading true if locations is empty after initial render
    if (!locations || locations.length === 0) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setSelectedLocationIndex(initialIndex);
    }
  }, [locations, initialIndex]);

  const currentLocation = activeLocations[selectedLocationIndex] || null;
  
  // Check if we have client data at all
  const hasClientData = data?.client !== undefined;
  const siteId = data?.client?.id || '';
  
  // Show error if no site ID provided
  if (!hasClientData || !siteId) {
    return (
      <div className="min-h-screen" style={{ paddingTop: 'var(--header-offset, 5rem)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Site Not Configured</h1>
            <p className="text-lg text-gray-600 mb-4">
              Please add <code className="bg-gray-100 px-2 py-1 rounded">?site=YOUR_CLIENT_ID</code> to the URL
            </p>
            <p className="text-sm text-gray-500">
              Example: http://localhost:3000/locations?site=cmnigwgqd0002bytqjw1z6lxh
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state only when we know data is missing
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ paddingTop: 'var(--header-offset, 5rem)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If no location data after loading check, show empty state
  if (!currentLocation) {
    return (
      <div className="min-h-screen" style={{ paddingTop: 'var(--header-offset, 5rem)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">No Locations Available</h1>
            <p className="text-lg text-gray-600">Please add locations in the CMS to display them here.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get images for current location
  const locationImages = currentLocation.gallery || [];
  const hasImages = locationImages.length > 0;
  const currentImage = hasImages ? (locationImages[currentImageIndex] || locationImages[0]) : null;

  // Image navigation
  const nextImage = () => {
    if (locationImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % locationImages.length);
    }
  };

  const prevImage = () => {
    if (locationImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + locationImages.length) % locationImages.length);
    }
  };

  // Location navigation
  const nextLocation = () => {
    if (activeLocations.length > 1) {
      setSelectedLocationIndex((prev) => (prev + 1) % activeLocations.length);
      setCurrentImageIndex(0); // Reset image index when changing location
    }
  };

  const prevLocation = () => {
    if (activeLocations.length > 1) {
      setSelectedLocationIndex((prev) => (prev - 1 + activeLocations.length) % activeLocations.length);
      setCurrentImageIndex(0); // Reset image index when changing location
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner - Full height with overlay for sticky header */}
      <div 
        className="relative flex items-center justify-center text-white overflow-hidden"
        style={{ 
          minHeight: '60vh',
          marginTop: 'calc(var(--header-offset, 5rem) * -1)',
          paddingTop: 'var(--header-offset, 5rem)',
          background: banner?.imageUrl ? 'transparent' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary, #8B5A2B) 100%)'
        }}
      >
        {/* Banner Image Background */}
        {banner?.imageUrl && (
          <>
            <img 
              src={banner.imageUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        
        {/* Background Pattern (only when no banner) */}
        {!banner?.imageUrl && (
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        )}
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6"
            style={{ 
              fontFamily: 'var(--font-heading, inherit)',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            {page?.title || 'Our Locations'}
          </motion.h1>
          
          {page?.subtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
            >
              {page.subtitle}
            </motion.p>
          )}

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-3 bg-white/80 rounded-full mt-2"
              />
            </div>
          </motion.div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="white"
            />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Location Selector - Toggle Switch Style */}
        {activeLocations.length > 1 && (
          <div className="mb-8">
            <div className="flex justify-center">
              <div className="inline-flex flex-wrap justify-center bg-gray-100 rounded-lg p-1 shadow-sm max-w-full">
                {activeLocations.map((location, index) => (
                  <button
                    key={location.id}
                    onClick={() => {
                      setSelectedLocationIndex(index);
                      setCurrentImageIndex(0);
                    }}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium text-xs sm:text-sm transition-all duration-200 ${
                      index === selectedLocationIndex
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {location.name}
                    {location.isPrimary && (
                      <span className="ml-2 text-xs opacity-90">(Main)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Location Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery with Navigation */}
          <div className="relative rounded-lg overflow-hidden shadow-xl h-96">
            {hasImages ? (
              <>
                <img
                  src={currentImage}
                  alt={currentLocation.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation */}
                {locationImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-75 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-75 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
                    >
                      <ChevronRight size={20} />
                    </button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {locationImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                {/* Image Counter */}
                {locationImages.length > 1 && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {locationImages.length}
                  </div>
                )}
              </>
            ) : (
              // No images uploaded state
              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                <div className="text-gray-400 text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">No Photos Uploaded</p>
                  <p className="text-sm">Upload photos to showcase this location</p>
                </div>
              </div>
            )}
          </div>

          {/* Location Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-4xl font-bold text-[var(--color-primary)]" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                {currentLocation.name}
              </h2>
              {currentLocation.isPrimary && (
                <span className="inline-block px-3 py-1 bg-[var(--color-secondary)] text-white text-sm rounded-full">
                  Main Location
                </span>
              )}
            </div>

            {/* Address */}
            <div className="flex items-start space-x-3">
              <MapPin className="text-[var(--color-secondary)] flex-shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Address</h3>
                <p className="text-gray-700">
                  {currentLocation.address.street}<br />
                  {currentLocation.address.suburb && `${currentLocation.address.suburb}, `}{currentLocation.address.city}, {currentLocation.address.state} {currentLocation.address.zipCode}<br />
                  {currentLocation.address.country}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${currentLocation.coordinates.latitude},${currentLocation.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[var(--color-secondary)] hover:underline mt-2"
                >
                  <Navigation size={16} className="mr-1" />
                  Get Directions
                </a>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-start space-x-3">
              <Phone className="text-[var(--color-secondary)] flex-shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Contact</h3>
                {currentLocation.contact.phone && (
                  <p className="text-gray-700">
                    <a href={`tel:${currentLocation.contact.phone}`} className="hover:underline">
                      {currentLocation.contact.phone}
                    </a>
                  </p>
                )}
                {currentLocation.contact.email && (
                  <p className="text-gray-700">
                    <a href={`mailto:${currentLocation.contact.email}`} className="hover:underline">
                      {currentLocation.contact.email}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Services Available - Only show if CMS has servicesAvailable */}
            {currentLocation.servicesAvailable && currentLocation.servicesAvailable.length > 0 && (
              <div className="flex items-start space-x-3">
                <UtensilsCrossed className="text-[var(--color-secondary)] flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Services Available</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentLocation.servicesAvailable.map((service, index) => {
                      const serviceLower = service.toLowerCase();
                      let className = "px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full";
                      
                      if (serviceLower.includes('dine') || serviceLower.includes('in')) {
                        className = "px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full";
                      } else if (serviceLower.includes('take') || serviceLower.includes('out')) {
                        className = "px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full";
                      } else if (serviceLower.includes('deliver')) {
                        className = "px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full";
                      }
                      
                      return (
                        <span key={index} className={className}>
                          {service}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hours of Operation - Always show all 7 days */}
        {currentLocation.hours && currentLocation.hours.length > 0 && (
          <div key={`hours-${currentLocation.id}`} className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <div className="flex items-center mb-6">
              <Clock className="text-[var(--color-secondary)] mr-3" size={24} />
              <h3 className="text-2xl font-bold text-[var(--color-primary)]">Hours of Operation</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentLocation.hours.map((hour) => {
                // Check if day is closed: either closed=true flag or no open/close times
                const hasTimes = hour.open && hour.close;
                const isClosed = hour.closed === true || !hasTimes;
                return (
                  <div
                    key={hour.day}
                    className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-700">{hour.day}</span>
                    <span className={`font-semibold ${
                      isClosed ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {isClosed ? 'Closed' : `${formatTime(hour.open)} – ${formatTime(hour.close)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* No Hours Available */}
        {(!currentLocation.hours || currentLocation.hours.length === 0) && (
          <div className="bg-gray-50 rounded-lg p-8 mb-12 text-center">
            <Clock className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Hours Not Available</h3>
            <p className="text-gray-500">Hours of operation haven't been set for this location yet.</p>
          </div>
        )}

        {/* Map */}
        <div className="rounded-lg overflow-hidden shadow-xl h-96 relative">
          {/* Custom Map Marker (if branding has one) */}
          {rawSettings?.mapMarker && (
            <div className="absolute top-4 right-4 z-10 bg-white p-2 rounded-lg shadow-lg">
              <img 
                src={rawSettings.mapMarker} 
                alt="Map Marker" 
                className="w-8 h-8 object-contain"
              />
            </div>
          )}
          
          {/* Google Maps Embed with street view */}
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(currentLocation.address.street + ', ' + currentLocation.address.city + ', ' + currentLocation.address.state + ' ' + currentLocation.address.zipCode)}&hl=en&z=16&output=embed`}
            width="100%"
            height="100%"
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map of ${currentLocation.name}`}
            style={{ border: '0px' }}
            className="rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}


