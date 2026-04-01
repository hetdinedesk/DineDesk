import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { MapPin, Phone, Mail, Clock, Navigation, Package, UtensilsCrossed } from 'lucide-react';

const LOCATION_IMAGE = 'https://images.unsplash.com/photo-1744776411223-71fb5794617a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwaW50ZXJpb3IlMjBsdXh1cnl8ZW58MXx8fHwxNzc0Nzk2NTQ3fDA&ixlib=rb-4.1.0&q=80&w=1080';

export default function LocationsPage() {
  const { locations } = useCMS();
  const [selectedLocation, setSelectedLocation] = useState(null);

  const activeLocations = locations.filter((loc) => loc.isActive);
  const primaryLocation = activeLocations.find((loc) => loc.isPrimary) || activeLocations[0];

  const displayLocation = selectedLocation
    ? activeLocations.find((loc) => loc.id === selectedLocation) || primaryLocation
    : primaryLocation;

  const formatHours = (hours) => {
    return hours.map((h) => ({
      ...h,
      display: h.closed ? 'Closed' : `${h.open} - ${h.close}`,
    }));
  };

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
            Our Locations
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl"
          >
            Visit us at any of our convenient locations
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Location Selector */}
        {activeLocations.length > 1 && (
          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              {activeLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => setSelectedLocation(location.id)}
                  className={`px-6 py-3 font-medium transition-colors ${
                    displayLocation.id === location.id
                      ? 'bg-[var(--color-secondary)] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {location.name}
                  {location.isPrimary && (
                    <span className="ml-2 text-xs">(Main)</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location Details */}
        <motion.div
          key={displayLocation.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
        >
          {/* Image */}
          <div className="rounded-lg overflow-hidden shadow-xl h-96">
            <img
              src={LOCATION_IMAGE}
              alt={displayLocation.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h2
                className="text-4xl font-bold text-[var(--color-primary)] mb-2"
                style={{ fontFamily: 'var(--font-heading, inherit)' }}
              >
                {displayLocation.name}
              </h2>
              {displayLocation.isPrimary && (
                <span className="inline-block px-3 py-1 bg-[var(--color-secondary)] text-white text-sm rounded-full">
                  Main Location
                </span>
              )}
            </div>

            {/* Address */}
            <div className="flex items-start space-x-3">
              <MapPin className="text-[var(--color-secondary)] flex-shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-lg mb-1">Address</h3>
                <p className="text-gray-700">
                  {displayLocation.address.street}<br />
                  {displayLocation.address.city}, {displayLocation.address.state} {displayLocation.address.zipCode}<br />
                  {displayLocation.address.country}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${displayLocation.coordinates.latitude},${displayLocation.coordinates.longitude}`}
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
              <div>
                <h3 className="font-semibold text-lg mb-1">Contact</h3>
                <p className="text-gray-700">
                  <a href={`tel:${displayLocation.contact.phone}`} className="hover:underline">
                    {displayLocation.contact.phone}
                  </a>
                </p>
                <p className="text-gray-700">
                  <a href={`mailto:${displayLocation.contact.email}`} className="hover:underline">
                    {displayLocation.contact.email}
                  </a>
                </p>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="flex items-start space-x-3">
              <UtensilsCrossed className="text-[var(--color-secondary)] flex-shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-lg mb-2">Services Available</h3>
                <div className="flex flex-wrap gap-2">
                  {displayLocation.deliveryOptions.dineIn && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      Dine-In
                    </span>
                  )}
                  {displayLocation.deliveryOptions.takeout && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Takeout
                    </span>
                  )}
                  {displayLocation.deliveryOptions.delivery && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      Delivery
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="flex items-center mb-6">
            <Clock className="text-[var(--color-secondary)] mr-3" size={24} />
            <h3 className="text-2xl font-bold text-[var(--color-primary)]">
              Hours of Operation
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formatHours(displayLocation.hours).map((hour) => (
              <div
                key={hour.day}
                className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-700">{hour.day}</span>
                <span className={`font-semibold ${hour.closed ? 'text-red-600' : 'text-green-600'}`}>
                  {hour.display}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 rounded-lg overflow-hidden shadow-xl h-96"
        >
          <iframe
            src={`https://www.google.com/maps?q=${displayLocation.coordinates.latitude},${displayLocation.coordinates.longitude}&hl=es;z=14&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map of ${displayLocation.name}`}
          />
        </motion.div>
      </div>
    </div>
  );
}


