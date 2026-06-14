'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, MessageSquare, Clock } from 'lucide-react'

const included = [
  'Full website build & configuration',
  'Menu setup (all items, categories, photos)',
  'Stripe payment integration',
  'Online ordering (pickup, delivery, dine-in)',
  'QR table ordering system',
  'Booking & reservations system',
  'Loyalty program setup',
  'Custom domain & SSL certificate',
  'CMS access from day one',
  'Staff accounts configured',
  'Google Analytics 4 connected',
  'Ongoing support included',
]

export function HomeCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy/40 to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-dine-orange/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-sm font-semibold text-dine-orange uppercase tracking-widest mb-4"
          >
            Ready to Get Started?
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold mb-6 leading-tight"
          >
            Your Complete Restaurant Platform —{' '}
            <span className="gradient-text">Built For You</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Contact us today. We build the whole thing — website, ordering, reservations,
            loyalty, analytics — and hand it to you ready to run.
          </motion.p>
        </div>

        {/* What's included grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-8 mb-10"
        >
          <p className="text-white font-semibold text-center mb-6">Everything included in your setup:</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {included.map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-dine-orange flex-shrink-0" />
                <span className="text-white/70 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <Link
            href="/contact"
            className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold btn-shine text-lg"
          >
            <MessageSquare className="w-5 h-5" />
            Tell Us About Your Restaurant
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full glass text-white font-semibold hover:bg-white/10 transition-all text-lg"
          >
            View Pricing
          </Link>
        </motion.div>

        {/* Trust notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-dine-orange/60" />
            Response within 24 hours
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-dine-orange/60" />
            No obligation consultation
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-dine-orange/60" />
            No long-term contracts
          </div>
        </motion.div>
      </div>
    </section>
  )
}
