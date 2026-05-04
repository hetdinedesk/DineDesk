import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { MapPin, Phone, Mail, Clock, Navigation, Send, Heart } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';
import DOMPurify from 'dompurify';

// Format time from various formats to readable format
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  // Handle 24-hour format (e.g., "1100", "14:30")
  const cleanTime = timeStr.replace(/[^0-9]/g, '');
  if (cleanTime.length === 4) {
    const hours = parseInt(cleanTime.substring(0, 2), 10);
    const minutes = cleanTime.substring(2, 4);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
  }
  
  // Return as-is if already formatted
  return timeStr;
};

// Map component
function MapEmbed({ location }) {
  const { address, coordinates } = location;
  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  const encodedAddress = encodeURIComponent(fullAddress);

  // Use coordinates if available, otherwise use address
  const src = coordinates?.latitude && coordinates?.longitude
    ? `https://maps.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}&hl=en&z=16&output=embed`
    : `https://maps.google.com/maps?q=${encodedAddress}&hl=en&z=16&output=embed`;

  return (
    <iframe
      src={src}
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={`Map of ${location.name || 'location'}`}
      className="rounded-[2rem]"
    />
  );
}

// Multi-location map section with cafe styling
function LocationMapSection({ locations, restaurantName }) {
  const [activeTab, setActiveTab] = useState(0);
  const activeLocation = locations[activeTab];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-24"
    >
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-[var(--color-secondary)] mb-4">
          Find Us
        </h2>
        <p className="text-[var(--color-secondary)]/60 max-w-xl mx-auto">
          Visit one of our locations and experience the perfect cup in person
        </p>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-[var(--color-secondary)]/10">
        {/* Location Tabs */}
        {locations.length > 1 && (
          <div className="flex border-b border-[var(--color-secondary)]/10 overflow-x-auto px-8 pt-6">
            {locations.map((loc, idx) => (
              <button
                key={loc.id}
                onClick={() => setActiveTab(idx)}
                className={`px-8 py-4 text-sm font-bold whitespace-nowrap transition-all rounded-t-full ${
                  activeTab === idx
                    ? 'text-[var(--color-secondary)] bg-[var(--color-accent)] border-b-2 border-[var(--color-primary)]'
                    : 'text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] hover:bg-[var(--color-accent)]/50'
                }`}
              >
                {loc.name || `Location ${idx + 1}`}
                {loc.isPrimary && (
                  <span className="ml-2 text-[10px] bg-[var(--color-primary)] text-[var(--color-secondary)] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Main
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Location Info */}
          <div className="p-10 bg-[var(--color-accent)] lg:col-span-2">
            <div className="space-y-6">
              {/* Location Name */}
              <div>
                <p className="text-[var(--color-primary)] font-bold text-xs uppercase tracking-[0.2em] mb-1">
                  Location
                </p>
                <h3 className="font-serif text-3xl font-bold text-[var(--color-secondary)]">
                  {activeLocation.name || restaurantName}
                </h3>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--color-secondary)]/20 flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[var(--color-secondary)] font-bold mb-1">Address</p>
                  <p className="text-[var(--color-secondary)]/70">
                    {activeLocation.address.street}<br />
                    {activeLocation.address.city}, {activeLocation.address.state} {activeLocation.address.zipCode}
                  </p>
                </div>
              </div>

              {/* Contact */}
              {(activeLocation.phone || activeLocation.email) && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--color-secondary)]/20 flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                    {activeLocation.phone ? <Phone size={20} /> : <Mail size={20} />}
                  </div>
                  <div>
                    <p className="text-[var(--color-secondary)] font-bold mb-1">Contact</p>
                    {activeLocation.phone && (
                      <a href={`tel:${activeLocation.phone}`} className="text-[var(--color-secondary)]/70 hover:text-[var(--color-primary)] block">
                        {activeLocation.phone}
                      </a>
                    )}
                    {activeLocation.email && (
                      <a href={`mailto:${activeLocation.email}`} className="text-[var(--color-secondary)]/70 hover:text-[var(--color-primary)] block">
                        {activeLocation.email}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Hours */}
              {activeLocation.hours && activeLocation.hours.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--color-secondary)]/20 flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                    <Clock size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--color-secondary)] font-bold mb-2">Opening Hours</p>
                    <div className="space-y-1 text-sm">
                      {activeLocation.hours.map((hour) => (
                        <div key={hour.day} className="flex justify-between">
                          <span className="text-[var(--color-secondary)]/60">{hour.day}</span>
                          <span className={hour.closed ? 'text-red-500' : 'text-[var(--color-secondary)]'}>
                            {hour.closed ? 'Closed' : `${formatTime(hour.open)} - ${formatTime(hour.close)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Directions Button */}
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${activeLocation.address.street}, ${activeLocation.address.city}, ${activeLocation.address.state} ${activeLocation.address.zipCode}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-8 py-4 bg-[var(--color-secondary)] text-[var(--color-accent)] font-bold rounded-2xl hover:bg-[var(--color-primary)] transition-all shadow-lg"
              >
                <Navigation size={18} />
                Get Directions
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-3 min-h-[500px] p-4 bg-[var(--color-accent)]">
            <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-lg">
              <MapEmbed location={activeLocation} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomTemplate({ data, page, banner }) {
  const { locations, shortcodes, restaurant, siteConfig } = useCMS();

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

  // Use the page passed from CMS
  const contactPage = page;

  if (!contactPage) {
    return (
      <div className="min-h-screen pt-40 flex items-center justify-center bg-[var(--color-accent)]">
        <p className="text-[var(--color-secondary)]">Page not found</p>
      </div>
    );
  }

  const title = replaceShortcodes(contactPage.title || '', shortcodes);
  const subtitle = replaceShortcodes(contactPage.subtitle || contactPage.metaDesc || '', shortcodes);
  const content = replaceShortcodes(contactPage.content || '', shortcodes);
  const labelText = replaceShortcodes(contactPage.label || 'Get in Touch', shortcodes);

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
    <div className="min-h-screen bg-[var(--color-accent)]">
      {/* Hero Section - Cafe Theme Style */}
      <div className="relative py-32 px-6 text-center overflow-hidden">
        {/* Optional Banner Background */}
        {pageBanner?.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img 
              src={pageBanner.imageUrl} 
              alt="" 
              className="w-full h-full object-cover opacity-15"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-accent)]/90 to-[var(--color-accent)]"></div>
          </div>
        )}
        
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Label */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-[var(--color-primary)] font-bold uppercase tracking-[0.2em] text-sm mb-6"
          >
            <Heart width={16} height={16} fill="currentColor" />
            <span>{labelText}</span>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-6xl md:text-8xl font-bold text-[var(--color-secondary)] mb-6"
          >
            {title}
          </motion.h1>
          
          {/* Subtitle */}
          {subtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto text-[var(--color-secondary)]/70 text-lg leading-relaxed"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className={`grid gap-12 ${showEnquiryForm ? 'grid-cols-1 lg:grid-cols-2 items-stretch' : 'grid-cols-1'}`}>
          {/* Content Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`flex flex-col ${showEnquiryForm ? 'h-full' : ''}`}
          >
            <div className={`bg-white rounded-[3rem] shadow-xl border border-[var(--color-secondary)]/10 ${showEnquiryForm ? 'p-10 lg:p-14 h-full flex flex-col' : 'p-8 lg:p-12'}`}>
              <div
                className={`prose prose-lg max-w-none text-[var(--color-secondary)]/80 leading-relaxed ${showEnquiryForm ? 'flex-1' : ''}`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
              />
            </div>
          </motion.div>

          {/* Contact Form - Cafe Styled */}
          {showEnquiryForm && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-[3rem] shadow-xl p-10 lg:p-14 border border-[var(--color-secondary)]/10"
            >
              <h2 className="font-serif text-3xl font-bold text-[var(--color-secondary)] mb-8">
                Send Us a Message
              </h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800">
                  Thank you! Your message has been sent successfully.
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800">
                  Sorry, there was an error sending your message. Please try again.
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 rounded-2xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-secondary)] placeholder:text-[var(--color-secondary)]/40 disabled:opacity-50"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 rounded-2xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-secondary)] placeholder:text-[var(--color-secondary)]/40 disabled:opacity-50"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 rounded-2xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-secondary)] placeholder:text-[var(--color-secondary)]/40 disabled:opacity-50"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 rounded-2xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-secondary)] placeholder:text-[var(--color-secondary)]/40 disabled:opacity-50"
                    placeholder="How can we help?"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 rounded-2xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-secondary)] placeholder:text-[var(--color-secondary)]/40 resize-none disabled:opacity-50"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[var(--color-secondary)] text-[var(--color-accent)] py-4 rounded-2xl font-bold text-lg hover:bg-[var(--color-primary)] transition-all duration-300 shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                  <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-sm text-[var(--color-secondary)]/50 text-center">
                  We'll get back to you within 24 hours
                </p>
              </form>
            </motion.div>
          )}
        </div>

        {/* Location Map Section */}
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


