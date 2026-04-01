import React from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

export default function ContactPage() {
  const { contentPages, locations, shortcodes } = useCMS();

  const contactPage = contentPages.find((page) => page.slug === 'contact' && page.isActive);
  const primaryLocation = locations.find((loc) => loc.isPrimary && loc.isActive) || locations[0];

  if (!contactPage) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-gray-600">Page not found</p>
      </div>
    );
  }

  const title = replaceShortcodes(contactPage.title || '', shortcodes);
  const subtitle = replaceShortcodes(contactPage.banner?.subtitle || '', shortcodes);
  const content = replaceShortcodes(contactPage.content || '', shortcodes);

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <div className="bg-[var(--color-primary)] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading, inherit)' }}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div
              className="prose prose-lg max-w-none mb-8 text-gray-700"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* Contact Information */}
            {primaryLocation && (
              <div className="space-y-6 mt-8">
                <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
                  Main Location
                </h2>

                <div className="flex items-start space-x-4">
                  <MapPin className="text-[var(--color-secondary)] flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Address</h3>
                    <p className="text-gray-700">
                      {primaryLocation.address.street}<br />
                      {primaryLocation.address.city}, {primaryLocation.address.state} {primaryLocation.address.zipCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="text-[var(--color-secondary)] flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Phone</h3>
                    <a
                      href={`tel:${primaryLocation.contact.phone}`}
                      className="text-gray-700 hover:text-[var(--color-secondary)]"
                    >
                      {primaryLocation.contact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="text-[var(--color-secondary)] flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Email</h3>
                    <a
                      href={`mailto:${primaryLocation.contact.email}`}
                      className="text-gray-700 hover:text-[var(--color-secondary)]"
                    >
                      {primaryLocation.contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="text-[var(--color-secondary)] flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Hours</h3>
                    <div className="space-y-1 text-gray-700">
                      {primaryLocation.hours.slice(0, 3).map((hour) => (
                        <div key={hour.day} className="flex justify-between">
                          <span>{hour.day}:</span>
                          <span className="ml-4">
                            {hour.closed ? 'Closed' : `${hour.open} - ${hour.close}`}
                          </span>
                        </div>
                      ))}
                      <a href="/locations" className="text-[var(--color-secondary)] hover:underline inline-block mt-2">
                        View all hours ??                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-xl p-8"
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
        </div>
      </div>
    </div>
  );
}


