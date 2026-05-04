import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';
import DOMPurify from 'dompurify';

// Clean HTML content - strip complex structures, keep basic text elements
const cleanPageContent = (html) => {
  if (!html) return ''

  let cleanHtml = html

  // Remove all div, section, article, etc. tags but keep their content
  cleanHtml = cleanHtml.replace(/<(div|section|article|aside|header|footer|nav|main|figure|figcaption|span)([^>]*)>([\s\S]*?)<\/\1>/gi, '$3')

  // Remove grid, flex, and layout-related classes
  cleanHtml = cleanHtml.replace(/\sclass="[^"]*?(grid|flex|col|row|gap|padding|margin|w-|h-|min-|max-|bg-|text-|shadow|rounded|border|transform|opacity)[^"]*"/gi, '')

  // Remove inline styles
  cleanHtml = cleanHtml.replace(/\sstyle="[^"]*"/gi, '')

  // Remove SVG icons and other non-text elements
  cleanHtml = cleanHtml.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')

  // Remove empty paragraphs
  cleanHtml = cleanHtml.replace(/<p>\s*<\/p>/gi, '')
  cleanHtml = cleanHtml.replace(/<p><\/p>/gi, '')

  // Clean up extra whitespace
  cleanHtml = cleanHtml.replace(/\s+/g, ' ')

  // Ensure paragraphs are properly wrapped
  cleanHtml = cleanHtml.replace(/([^.!?])\n([^<])/g, '$1<p>$2')

  return cleanHtml
}

// Format time from 24-hour format (e.g., "1100") to readable format (e.g., "11 AM")
const formatTime = (timeStr) => {
  if (!timeStr || timeStr.length !== 4) return timeStr

  const hours = parseInt(timeStr.substring(0, 2), 10)
  const minutes = timeStr.substring(2, 4)

  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12 // Convert 0 to 12 for midnight

  return `${displayHours}:${minutes} ${period}`
}

// Map component that supports multiple providers
function MapEmbed({ location, provider = 'google' }) {
  const { address, lat, lng } = location;
  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;

  // Google Maps embed (free, no API key required for basic embed)
  if (provider === 'google') {
    const encodedAddress = encodeURIComponent(fullAddress);
    // Use Google Maps embed API with coordinates if available, otherwise use address
    if (lat && lng) {
      return (
        <iframe
          src={`https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=16&output=embed`}
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
    // Fallback to address-based embed
    return (
      <iframe
        src={`https://maps.google.com/maps?q=${encodedAddress}&hl=en&z=16&output=embed`}
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
  const hasCoordinates = activeLocation?.lat && activeLocation?.lng;

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
                    {hour.closed ? 'Closed' : `${formatTime(hour.open)} - ${formatTime(hour.close)}`}
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
            <MapEmbed location={activeLocation} provider="google" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomTemplate({ data, page, banner }) {
  const { locations, shortcodes, restaurant } = useCMS();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_CMS_API_URL || process.env.CMS_API_URL;
      const response = await fetch(`${apiUrl}/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          clientId: data?.client?.id
        })
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

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
        <div className={`grid gap-12 ${showEnquiryForm ? 'grid-cols-1 lg:grid-cols-2 items-stretch' : 'grid-cols-1'}`}>
          {/* Content Column - Only shows CMS content, no auto location info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col ${showEnquiryForm ? 'h-full' : ''}`}
          >
            <div className={`bg-white rounded-2xl shadow-xl ${showEnquiryForm ? 'p-6 sm:p-10 lg:p-14 h-full flex flex-col' : 'p-6 sm:p-8 lg:p-10'}`}>
              <div
                className={`prose prose-lg sm:prose-xl max-w-none text-gray-800 leading-relaxed ${showEnquiryForm ? 'flex-1' : ''}`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanPageContent(content)) }}
              />
            </div>
          </motion.div>

          {/* Contact Form - Only if enabled */}
          {showEnquiryForm && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-xl p-8 flex flex-col"
            >
              <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
                Send Us a Message
              </h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  Thank you! Your message has been sent successfully.
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  Sorry, there was an error sending your message. Please try again.
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] disabled:opacity-50"
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
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] disabled:opacity-50"
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
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] disabled:opacity-50"
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
                    value={formData.subject}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] disabled:opacity-50"
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
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] resize-none disabled:opacity-50"
                    placeholder="Tell us more..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[var(--color-secondary)] text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
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


