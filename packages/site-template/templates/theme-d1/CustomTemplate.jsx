import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

// Map component that supports multiple providers
function MapEmbed({ location, provider = 'google' }) {
  const { address, coordinates } = location;
  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  
  // Google Maps embed (free, no API key required for basic embed)
  if (provider === 'google') {
    const encodedAddress = encodeURIComponent(fullAddress);
    return (
      <iframe
        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5000!2d${coordinates?.longitude || 0}!3d${coordinates?.latitude || 0}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDQ4JzAwLjAiUyAxNDXCsDAwJzAwLjAiRQ!5e0!3m2!1sen!2sau!4v1600000000000!5m2!1sen!2sau&q=${encodedAddress}`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map of ${location.name || 'location'}`}
      />
    );
  }
  
  // Fallback to static map image + link
  return (
    <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-6">
      <MapPin size={48} className="text-[var(--color-secondary)] mb-4" />
      <p className="text-gray-600 text-center mb-4">{fullAddress}</p>
      <a
        href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-secondary)] text-white rounded-lg hover:bg-opacity-90 transition-all"
      >
        <Navigation size={18} />
        Open in Google Maps
      </a>
    </div>
  );
}

// Multi-location map section with tabs
function LocationMapSection({ locations, restaurantName }) {
  const [activeTab, setActiveTab] = useState(0);
  const activeLocation = locations[activeTab];
  
  // Check if we have coordinates for map
  const hasCoordinates = activeLocation?.coordinates?.latitude && activeLocation?.coordinates?.longitude;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-16 pt-12 border-t border-gray-200"
    >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Location Tabs - Only show if multiple locations */}
        {locations.length > 1 && (
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {locations.map((loc, idx) => (
              <button
                key={loc.id}
                onClick={() => setActiveTab(idx)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === idx 
                    ? 'text-[var(--color-secondary)] border-b-2 border-[var(--color-secondary)] bg-gray-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {loc.name || `Location ${idx + 1}`}
                {loc.isPrimary && <span className="ml-2 text-xs bg-[var(--color-secondary)] text-white px-2 py-0.5 rounded">Primary</span>}
              </button>
            ))}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Location Info */}
          <div className="p-8 bg-gray-50">
            <p className="text-sm text-[var(--color-secondary)] font-semibold uppercase tracking-wider mb-2">
              {activeLocation.name || 'Location'}
            </p>
            <h3 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
              {restaurantName}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-[var(--color-secondary)] flex-shrink-0 mt-1" size={20} />
                <p className="text-gray-700">
                  {activeLocation.address.street}<br />
                  {activeLocation.address.city}, {activeLocation.address.state} {activeLocation.address.zipCode}
                </p>
              </div>
              
              {activeLocation.contact?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="text-[var(--color-secondary)] flex-shrink-0" size={20} />
                  <a 
                    href={`tel:${activeLocation.contact.phone}`}
                    className="text-gray-700 hover:text-[var(--color-secondary)]"
                  >
                    {activeLocation.contact.phone}
                  </a>
                </div>
              )}
              
              {activeLocation.contact?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="text-[var(--color-secondary)] flex-shrink-0" size={20} />
                  <a 
                    href={`mailto:${activeLocation.contact.email}`}
                    className="text-gray-700 hover:text-[var(--color-secondary)]"
                  >
                    {activeLocation.contact.email}
                  </a>
                </div>
              )}
            </div>

            <h4 className="font-semibold text-lg mt-6 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-[var(--color-secondary)]" />
              Trading Hours
            </h4>
            <div className="space-y-2 text-sm">
              {(activeLocation.hours || []).map((hour) => (
                <div key={hour.day} className="flex justify-between">
                  <span className="text-gray-600">{hour.day}:</span>
                  <span className="text-gray-800">
                    {hour.closed ? 'Closed' : `${hour.open} - ${hour.close}`}
                  </span>
                </div>
              ))}
            </div>

            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(
                `${activeLocation.address.street}, ${activeLocation.address.city}, ${activeLocation.address.state} ${activeLocation.address.zipCode}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[var(--color-secondary)] text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all"
            >
              <Navigation size={18} />
              Get Directions
            </a>
          </div>

          {/* Map */}
          <div className="lg:col-span-2 min-h-[400px] relative bg-gray-100">
            {hasCoordinates ? (
              <MapEmbed location={activeLocation} provider="google" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6">
                <MapPin size={48} className="text-[var(--color-secondary)] mb-4" />
                <p className="text-gray-600 text-center mb-4">
                  {activeLocation.address.street}<br />
                  {activeLocation.address.city}, {activeLocation.address.state} {activeLocation.address.zipCode}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Coordinates not available. Please add them in the CMS to display the map.
                </p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${activeLocation.address.street}, ${activeLocation.address.city}, ${activeLocation.address.state} ${activeLocation.address.zipCode}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-secondary)] text-white rounded-lg hover:bg-opacity-90 transition-all"
                >
                  <Navigation size={18} />
                  View on Google Maps
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomTemplate({ data, page, banner }) {
  const { locations, shortcodes, restaurant } = useCMS();

  // Use the page passed from CMS, or fallback to finding it
  const contactPage = page;
  const primaryLocation = locations.find((loc) => loc.isPrimary && loc.isActive) || locations[0];

  if (!contactPage) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-gray-600">Page not found</p>
      </div>
    );
  }

  const title = replaceShortcodes(contactPage.title || '', shortcodes);
  const subtitle = replaceShortcodes(contactPage.subtitle || contactPage.metaDesc || '', shortcodes);
  const content = replaceShortcodes(contactPage.content || '', shortcodes);

  // Check toggles from page settings
  const showEnquiryForm = contactPage.showEnquiryForm || false;
  const showLocationMap = contactPage.showLocationMap || false;

  // Get banner from page data or passed prop
  const pageBanner = banner || (contactPage?.bannerId ? data?.banners?.find(b => b.id === contactPage.bannerId) : null);

  return (
    <div className="min-h-screen">
      {/* Hero Banner - Matches Locations page style */}
      <div 
        className="relative flex items-center justify-center text-white overflow-hidden"
        style={{ 
          minHeight: '60vh',
          marginTop: 'calc(var(--header-offset, 5rem) * -1)',
          paddingTop: 'var(--header-offset, 5rem)',
          background: pageBanner?.imageUrl ? 'transparent' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary, #8B5A2B) 100%)'
        }}
      >
        {/* Banner Image Background */}
        {pageBanner?.imageUrl && (
          <>
            <img 
              src={pageBanner.imageUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        
        {/* Background Pattern (only when no banner) */}
        {!pageBanner?.imageUrl && (
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
            {title}
          </motion.h1>
          
          {subtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
            >
              {subtitle}
            </motion.p>
          )}
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
        {/* Main Content Area */}
        <div className={`grid gap-12 ${showEnquiryForm ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
          {/* Content Column - Only shows CMS content, no auto location info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div
              className="prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </motion.div>

          {/* Contact Form - Only if enabled */}
          {showEnquiryForm && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-xl p-8 h-fit"
            >
              <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
                Send Us a Message
              </h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] resize-none"
                    placeholder="Tell us more..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[var(--color-secondary)] text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105"
                >
                  Send Message
                </button>

                <p className="text-sm text-gray-500 text-center">
                  We'll get back to you within 24 hours
                </p>
              </form>
            </motion.div>
          )}
        </div>

        {/* Location Map Section - Full width, shows ALL locations */}
        {showLocationMap && locations.length > 0 && (
          <LocationMapSection 
            locations={locations} 
            restaurantName={data?.client?.name || restaurant?.name || 'Visit Us'} 
          />
        )}
      </div>
    </div>
  );
}


