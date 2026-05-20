'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Star, MapPin, Clock, Quote, Check } from 'lucide-react'

const features = [
  {
    icon: Star,
    title: 'Automatic Sync',
    description: 'Connect your Google Place ID and reviews sync automatically. No manual updates needed.',
  },
  {
    icon: Quote,
    title: 'Reviews Carousel',
    description: 'Display your best reviews in an attractive carousel on your homepage.',
  },
  {
    icon: Check,
    title: 'Floating Widget',
    description: 'Add a floating review widget that shows your star rating and review count.',
  },
  {
    icon: MapPin,
    title: 'Header & Footer Display',
    description: 'Show your rating in the header or footer for maximum visibility.',
  },
  {
    icon: Clock,
    title: 'Real-Time Updates',
    description: 'New reviews appear on your site as soon as they\'re posted on Google.',
  },
  {
    icon: Star,
    title: 'Filter by Rating',
    description: 'Choose to display only reviews above a certain rating threshold.',
  },
]

const mockReviews = [
  {
    name: 'Sarah M.',
    rating: 5,
    text: 'Amazing food and even better service! The online ordering was so easy to use.',
    time: '2 days ago',
  },
  {
    name: 'James K.',
    rating: 5,
    text: 'Best restaurant in town. The QR table ordering made our experience seamless.',
    time: '1 week ago',
  },
  {
    name: 'Emily R.',
    rating: 5,
    text: 'Love the ambiance and the staff were incredibly friendly. Highly recommend!',
    time: '2 weeks ago',
  },
]

export function GoogleReviewsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy/20 to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-15" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Star className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">Google Reviews</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5"
          >
            Showcase Your{' '}
            <span className="gradient-text">Reviews</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Automatically display your Google Reviews on your restaurant website. Build trust
            with social proof and attract more customers.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-dine-orange/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dine-orange to-dine-coral flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Mock Reviews Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="glass rounded-3xl p-8 border border-white/10"
        >
          <div className="text-center mb-8">
            <h3 className="text-xl font-display font-bold text-white mb-2">Live Preview</h3>
            <p className="text-sm text-white/50">See how your reviews will appear on your site</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {mockReviews.map((review, index) => (
              <div key={index} className="glass rounded-xl p-5 border border-white/10">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-dine-orange text-dine-orange" />
                  ))}
                </div>
                <p className="text-white/80 text-sm mb-4 leading-relaxed">"{review.text}"</p>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm font-medium">{review.name}</span>
                  <span className="text-white/40 text-xs">{review.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
