'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Shield, Lock, Server, CheckCircle, Globe, CreditCard } from 'lucide-react'

const features = [
  {
    icon: Lock,
    title: 'SSL Certificates',
    description: 'Every site includes free SSL encryption. All data transmitted between your customers and your site is secure.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Powered by Stripe with PCI DSS Level 1 compliance. Credit card data never touches our servers.',
  },
  {
    icon: Server,
    title: 'Australian Hosting',
    description: 'Your site is hosted on Australian servers for fast load times and data sovereignty compliance.',
  },
  {
    icon: Globe,
    title: 'Global CDN',
    description: 'Content delivery network ensures your site loads quickly for customers anywhere in the world.',
  },
  {
    icon: Shield,
    title: 'Data Protection',
    description: 'Regular backups, secure storage, and access controls protect your restaurant data.',
  },
  {
    icon: CheckCircle,
    title: 'GDPR Compliant',
    description: 'Built with privacy in mind. You control your data and can export it at any time.',
  },
]

export function SecurityTrustSection() {
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
            <Shield className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">Security & Trust</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5"
          >
            Built for{' '}
            <span className="gradient-text">Security</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Your data and your customers' data are protected with enterprise-grade security.
            We take security seriously so you can focus on running your restaurant.
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

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="glass rounded-3xl p-8 border border-white/10"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-display font-bold text-white mb-2">256-bit</div>
              <div className="text-sm text-white/50">SSL Encryption</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-white mb-2">PCI DSS</div>
              <div className="text-sm text-white/50">Level 1 Certified</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-white mb-2">99.9%</div>
              <div className="text-sm text-white/50">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-white mb-2">24/7</div>
              <div className="text-sm text-white/50">Monitoring</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
