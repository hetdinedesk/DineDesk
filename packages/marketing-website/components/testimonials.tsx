'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Marco Rossi',
    role: 'Owner, Bella Vista Italian',
    image: 'M',
    content: 'DineDesk transformed our restaurant. The QR ordering alone increased our average order value by 30%. Customers love the convenience, and our staff can focus on service instead of taking orders.',
    rating: 5,
  },
  {
    name: 'Sarah Chen',
    role: 'Manager, Noodle House',
    image: 'S',
    content: 'We went from no online presence to a fully functional website with ordering in just 3 days. The DineDesk team handled everything — menu setup, photos, and even the domain configuration.',
    rating: 5,
  },
  {
    name: 'James Wilson',
    role: 'Owner, The Burger Joint',
    image: 'J',
    content: 'The loyalty program has been a game changer. We have over 500 active members now, and our repeat customer rate has doubled. The analytics help us understand what our customers want.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Director, Cafe Del Sol',
    image: 'E',
    content: 'Managing 3 locations used to be a nightmare. With DineDesk, everything is centralized — one dashboard for all locations, unified reporting, and consistent branding across all sites.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'Chef/Owner, Seoul Kitchen',
    image: 'D',
    content: 'The booking system is fantastic. We used to lose reservations to phone tag. Now customers book online, get confirmations automatically, and we can see everything in one place.',
    rating: 5,
  },
  {
    name: 'Lisa Thompson',
    role: 'Owner, Sweet Treats Bakery',
    image: 'L',
    content: 'As a small bakery, we could not afford expensive developers. DineDesk gave us a professional website that looks like we spent thousands. Our online orders have increased 200%.',
    rating: 5,
  },
]

export function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Star className="w-4 h-4 text-dine-orange fill-dine-orange" />
            <span className="text-sm text-white/80">Restaurant Owner Reviews</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
          >
            Trusted by{' '}
            <span className="gradient-text">Hundreds of Restaurants</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            See how restaurant owners across the country are growing their businesses with DineDesk.
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass rounded-2xl p-6 card-hover"
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <Quote className="w-8 h-8 text-dine-orange/30" />
              </div>
              
              {/* Content */}
              <p className="text-white/80 text-sm leading-relaxed mb-6">
                "{testimonial.content}"
              </p>
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dine-orange to-dine-coral flex items-center justify-center">
                  <span className="text-white font-bold">{testimonial.image}</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{testimonial.name}</p>
                  <p className="text-white/50 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
