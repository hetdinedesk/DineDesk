'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Zap, Globe, Star, CreditCard, Smartphone, BarChart3 } from 'lucide-react'

const integrations = [
  {
    icon: CreditCard,
    name: 'Stripe',
    description: 'Secure payment processing with support for cards, Apple Pay, Google Pay, and more.',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    icon: Globe,
    name: 'Netlify',
    description: 'Fast, reliable global CDN deployment with automatic SSL and continuous deployment.',
    color: 'from-teal-500 to-cyan-600',
  },
  {
    icon: Star,
    name: 'Google Reviews',
    description: 'Automatic Google Reviews integration with carousel and floating widget display.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Smartphone,
    name: 'QR Ordering',
    description: 'Contactless table ordering with unique QR codes for each table.',
    color: 'from-dine-orange to-dine-coral',
  },
  {
    icon: BarChart3,
    name: 'Google Analytics',
    description: 'Track visitor behavior, conversions, and performance with detailed analytics.',
    color: 'from-orange-500 to-red-600',
  },
  {
    icon: Zap,
    name: 'Social Links',
    description: 'Connect your Instagram, Facebook, and other social media profiles.',
    color: 'from-pink-500 to-rose-600',
  },
]

export function IntegrationsSection() {
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
            <Zap className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">Integrations</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5"
          >
            Powerful{' '}
            <span className="gradient-text">Integrations</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
              Connect with the tools you already use. We integrate with leading services to make
              your restaurant platform more powerful.
          </motion.p>
        </div>

        {/* Integrations Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-dine-orange/30 transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center mb-4`}>
                <integration.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-2">{integration.name}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{integration.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
