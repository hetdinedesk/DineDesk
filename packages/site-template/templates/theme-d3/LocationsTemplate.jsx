import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { MapPin, Phone, Mail, Clock, Navigation, ExternalLink, UtensilsCrossed, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

// Format hours for display
function formatHoursDisplay(hours) {
  if (!hours || hours.length === 0) return 'Contact for hours';
  
  // Find patterns in hours to simplify display
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayOrder = days.reduce((acc, day) => {
    const hour = hours.find(h => h.day === day);
    if (hour && !hour.closed && hour.open && hour.close) {
      const timeStr = `${hour.open} - ${hour.close}`;
      acc[timeStr] = acc[timeStr] || [];
      acc[timeStr].push(day);
    }
    return acc;
  }, {});
  
  // Return simplified hours if all weekdays are same
  const weekdayKey = Object.keys(dayOrder).find(key => 
    dayOrder[key].includes('Monday') && dayOrder[key].includes('Friday')
  );
  
  if (weekdayKey) {
    return `Monday - Friday: ${weekdayKey}`;
  }
  
  return 'Hours vary by day';
}

export default function LocationsPage({ data, page, banner }) {
  const { locations, shortcodes } = useCMS();
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});

  const activeLocations = locations?.filter((loc) => loc.isActive) || [];

  const pageTitle = replaceShortcodes(page?.title || 'Find Us', shortcodes);
  const pageSubtitle = replaceShortcodes(page?.subtitle || page?.metaDesc || 'Visit one of our artisanal spaces and experience the perfect cup in person.', shortcodes);

  // Get current image index for a location
  const getImageIndex = (locationId) => currentImageIndexes[locationId] || 0;
  
  // Set image index for a location
  const setImageIndex = (locationId, index) => {
    setCurrentImageIndexes(prev => ({ ...prev, [locationId]: index }));
  };

  // Navigate images
  const nextImage = (location) => {
    const currentIdx = getImageIndex(location.id);
    const maxIdx = (location.gallery?.length || 1) - 1;
    setImageIndex(location.id, currentIdx >= maxIdx ? 0 : currentIdx + 1);
  };

  const prevImage = (location) => {
    const currentIdx = getImageIndex(location.id);
    const maxIdx = (location.gallery?.length || 1) - 1;
    setImageIndex(location.id, currentIdx <= 0 ? maxIdx : currentIdx - 1);
  };

  // Get image for a location at current index
  const getLocationImage = (location) => {
    const gallery = location.gallery || [];
    const idx = getImageIndex(location.id);
    
    if (gallery.length > 0) {
      return gallery[idx] || gallery[0];
    }
    if (location.exteriorImage) {
      return location.exteriorImage;
    }
    return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop';
  };

  // Resolve banner from prop or page bannerId
  const pageBanner = banner || (page?.bannerId ? data?.banners?.find(b => b.id === page.bannerId) : null);

  // Get service tag styling
  const getServiceStyle = (service) => {
    const serviceLower = service.toLowerCase();
    if (serviceLower.includes('dine') || serviceLower.includes('in')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (serviceLower.includes('take') || serviceLower.includes('out')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (serviceLower.includes('deliver')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (serviceLower.includes('catering')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (serviceLower.includes('event') || serviceLower.includes('private')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    return 'bg-[var(--color-primary)]/10 text-[var(--color-secondary)] border-[var(--color-primary)]/20';
  };

  // Build address string
  const buildAddress = (address) => {
    const parts = [
      address.street,
      address.suburb,
      `${address.city}, ${address.state} ${address.zipCode}`
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Get Google Maps directions URL
  const getDirectionsUrl = (location) => {
    const query = encodeURIComponent(buildAddress(location.address));
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  };

  // Get Google Maps view URL
  const getMapUrl = (location) => {
    const query = encodeURIComponent(buildAddress(location.address));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  if (activeLocations.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-accent)] pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-serif text-6xl font-bold text-[var(--color-secondary)] mb-4">No Locations Available</h1>
          <p className="text-[var(--color-secondary)]/60">Please add locations to display them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-accent)]">
      {/* Hero Section with Optional Banner */}
      <div className="relative bg-[var(--color-secondary)] py-48 px-6 text-center text-[var(--color-accent)] overflow-hidden">
        {/* Background Image from CMS Banner */}
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
          <img 
            src={pageBanner?.imageUrl || 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2033&auto=format&fit=crop'} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-6xl md:text-[120px] leading-[0.8] tracking-tight"
          >
            {pageTitle}
          </motion.h1>
          
          {pageSubtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-xl mx-auto text-[var(--color-accent)]/60 font-sans text-sm font-light leading-relaxed"
            >
              {pageSubtitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Locations List */}
      <div className="max-w-7xl mx-auto py-32 px-6">
        <div className="space-y-48">
          {activeLocations.map((location, index) => {
            const isReversed = index % 2 === 1;
            const displayHours = formatHoursDisplay(location.hours);
            
            return (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-24 items-center`}
              >
                {/* Image with Gallery Navigation */}
                <div className="w-full lg:w-1/2 aspect-square rounded-[48px] overflow-hidden shadow-xl group">
                  <img
                    src={getLocationImage(location)}
                    alt={location.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  
                  {/* Gallery Navigation */}
                  {(location.gallery?.length || 0) > 1 && (
                    <>
                      {/* Prev/Next Buttons */}
                      <button
                        onClick={() => prevImage(location)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                      >
                        <ChevronLeft width={20} height={20} className="text-[var(--color-secondary)]" />
                      </button>
                      <button
                        onClick={() => nextImage(location)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                      >
                        <ChevronRight width={20} height={20} className="text-[var(--color-secondary)]" />
                      </button>
                      
                      {/* Image Indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {(location.gallery || []).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setImageIndex(location.id, idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === getImageIndex(location.id) 
                                ? 'bg-white w-6' 
                                : 'bg-white/50 hover:bg-white/80'
                            }`}
                          />
                        ))}
                      </div>
                      
                      {/* Image Counter */}
                      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        {getImageIndex(location.id) + 1} / {location.gallery.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="w-full lg:w-1/2 space-y-12">
                  {/* Title */}
                  <div className="space-y-6">
                    <h2 className="font-serif text-5xl md:text-7xl text-[var(--color-secondary)] italic leading-none">
                      {location.name}
                    </h2>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-10">
                    {/* Address */}
                    <div className="flex gap-6 items-start group">
                      <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-all duration-500">
                        <MapPin width={20} height={20} strokeWidth={2} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-sans text-[10px] font-bold tracking-widest text-[var(--color-secondary)]/30 uppercase">Address</h4>
                        <p className="font-serif text-2xl italic text-[var(--color-secondary)]">
                          {buildAddress(location.address)}
                        </p>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex gap-6 items-start">
                      <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center text-[var(--color-primary)]">
                        <Clock width={20} height={20} strokeWidth={2} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-sans text-[10px] font-bold tracking-widest text-[var(--color-secondary)]/30 uppercase">Hours</h4>
                        <p className="font-serif text-2xl italic text-[var(--color-secondary)]">
                          {displayHours}
                        </p>
                        {location.hours && location.hours.length > 0 && (
                          <div className="mt-2 text-sm text-[var(--color-secondary)]/60">
                            {location.hours.map(h => (
                              <div key={h.day} className="flex justify-between gap-4">
                                <span>{h.day}</span>
                                <span>{h.closed || !h.open ? 'Closed' : `${h.open} - ${h.close}`}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    {(location.phone || location.email) && (
                      <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center text-[var(--color-primary)]">
                          {location.phone ? <Phone width={20} height={20} strokeWidth={2} /> : <Mail width={20} height={20} strokeWidth={2} />}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-sans text-[10px] font-bold tracking-widest text-[var(--color-secondary)]/30 uppercase">Contact</h4>
                          {location.phone && (
                            <a 
                              href={`tel:${location.phone}`}
                              className="font-serif text-2xl italic text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors block"
                            >
                              {location.phone}
                            </a>
                          )}
                          {location.email && (
                            <a 
                              href={`mailto:${location.email}`}
                              className="font-serif text-2xl italic text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors block"
                            >
                              {location.email}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-6 pt-6">
                    <a
                      href={getDirectionsUrl(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[var(--color-primary)] text-[var(--color-accent)] px-8 py-4 rounded-full font-bold hover:bg-[var(--color-secondary)] transition-all duration-300 flex items-center gap-3 group shadow-xl"
                    >
                      GET DIRECTIONS
                      <Navigation className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" width={18} height={18} strokeWidth={2} />
                    </a>
                    <a
                      href={getMapUrl(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-[var(--color-secondary)]/10 text-[var(--color-secondary)] px-8 py-4 rounded-full font-bold hover:bg-[var(--color-accent)] transition-all duration-300 flex items-center gap-3 group"
                    >
                      VIEW DETAILS
                      <ExternalLink className="group-hover:scale-110 transition-transform" width={18} height={18} strokeWidth={2} />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


