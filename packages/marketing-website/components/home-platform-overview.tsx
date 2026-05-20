'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import {
  Globe,
  ShoppingCart,
  QrCode,
  Calendar,
  Gift,
  MapPin,
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Users,
  ArrowRight,
  Bell
} from 'lucide-react'

const platformFeatures = [
  {
    icon: Globe,
    title: 'Restaurant Website Builder',
    description: 'Professional website with multiple themes — fine dining, café, casual, delivery-first and more. Fully managed by us, updated via CMS by you.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: ShoppingCart,
    title: 'Online Ordering',
    description: 'Pickup, delivery and dine-in ordering with add-ons, variants, taxes and secure Stripe payment processing. Order confirmations sent via email.',
    color: 'from-dine-orange to-dine-coral',
  },
  {
    icon: QrCode,
    title: 'QR Table Ordering',
    description: 'Customers scan a QR code at their table, browse the menu and order without a server. No app needed. Reduces wait times and increases order values.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Calendar,
    title: 'Reservations & Bookings',
    description: 'Accept table reservations online 24/7. Auto-assigns tables by party size, checks availability in real-time and sends confirmation emails.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Gift,
    title: 'Loyalty Program',
    description: 'Points-based rewards system. Customers earn on every order and redeem for rewards. Full order history, phone-based lookup and custom reward catalog.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: MapPin,
    title: 'Multi-Location Support',
    description: 'Manage multiple restaurant locations from one dashboard. Location-specific menus, operating hours, tables, staff and settings.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: LayoutDashboard,
    title: 'Real-Time Operations Dashboard',
    description: 'Live order management with full status tracking — New, Accepted, Preparing, Ready, Completed. Update statuses instantly from any device.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: CreditCard,
    title: 'Stripe Payments',
    description: 'Integrated Stripe processing for cards, Apple Pay and Google Pay. Server-side price verification. Cash payment option also supported.',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Google Analytics 4',
    description: 'Built-in GA4 integration. Track visitors, pageviews, bounce rate and session duration directly from your CMS dashboard.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Bell,
    title: 'Email Notifications',
    description: 'Automated order confirmations, booking confirmations and restaurant alerts via SendGrid. No manual follow-up needed.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Role-Based Staff Access',
    description: 'Super Admin, Manager and Editor roles. Control exactly who can access orders, menu items, content, config and deployment settings.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Globe,
    title: 'Netlify Deployment',
    description: 'One-click deployment to Netlify with automatic SSL. Custom domains supported. Cloudflare R2 for fast image and media storage.',
    color: 'from-lime-500 to-green-500',
  },
]

export function HomePlatformOverview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <motion.div
        className="absolute top-1/2 left-0 w-96 h-96 bg-dine-orange/10 rounded-full blur-3xl"
        animate={{ x: [0, 80, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={ref} className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-sm font-semibold text-dine-orange uppercase tracking-widest mb-4"
          >
            The Full Platform
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
          >
            Everything Built In.{' '}
            <span className="gradient-text">Nothing Left Out.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            DineDesk is not just a website builder. It is a complete restaurant operating
            platform — website, ordering, reservations, loyalty, analytics and staff management
            all connected in one system.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {platformFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className="group glass rounded-2xl p-5 card-hover relative overflow-hidden"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-display font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{feature.description}</p>
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Link
            href="/features"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass text-white font-semibold hover:bg-white/10 transition-all group"
          >
            Explore All Features
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
