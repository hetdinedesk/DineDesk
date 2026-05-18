'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  Globe, 
  ShoppingCart, 
  Calendar, 
  QrCode, 
  Gift, 
  MapPin, 
  LayoutDashboard,
  CreditCard,
  Bell,
  BarChart3,
  Users,
  Zap
} from 'lucide-react'

const features = [
  {
    icon: Globe,
    title: 'Professional Website Builder',
    description: 'Choose from multiple stunning themes designed for fine dining, cafes, food trucks, and more. Mobile-responsive with real-time CMS updates.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: ShoppingCart,
    title: 'Online Ordering System',
    description: 'Complete ordering with pickup, delivery, and dine-in options. Add-ons, variants, taxes, and secure payment processing included.',
    color: 'from-dine-orange to-dine-coral',
  },
  {
    icon: QrCode,
    title: 'QR Table Ordering',
    description: 'Customers scan, order, and pay from their table. No app download required. Reduces wait times and increases order values.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Calendar,
    title: 'Reservations & Bookings',
    description: 'Accept table reservations with availability checking. Auto-assign tables and send confirmation emails to guests.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Gift,
    title: 'Loyalty & Rewards',
    description: 'Build customer loyalty with points, rewards, and personalized offers. Track customer history and preferences.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: MapPin,
    title: 'Multi-Location Support',
    description: 'Manage multiple restaurant locations from one dashboard. Location-specific menus, hours, and settings.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: LayoutDashboard,
    title: 'Real-Time Operations Dashboard',
    description: 'Live order management with status tracking. See orders as they come in and update statuses in real-time.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Integrated Stripe payments with support for cards, Apple Pay, Google Pay. Cash payment options also available.',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Google Analytics 4 integration, revenue tracking, top items report, and customer behavior insights.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Bell,
    title: 'Email Notifications',
    description: 'Automated order confirmations, booking confirmations, and restaurant notifications via SendGrid integration.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Staff Access Control',
    description: 'Role-based permissions for owners, managers, and staff. Control who can access orders, menu, and settings.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Zap,
    title: 'Instant Deployment',
    description: 'One-click deployment to Netlify with automatic SSL. Your website goes live in seconds, not days.',
    color: 'from-lime-500 to-green-500',
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div className="glass rounded-2xl p-6 h-full card-hover">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <feature.icon className="w-6 h-6 text-white" />
        </div>
        
        {/* Content */}
        <h3 className="text-lg font-display font-bold text-white mb-2">
          {feature.title}
        </h3>
        <p className="text-sm text-white/60 leading-relaxed">
          {feature.description}
        </p>
        
        {/* Hover Gradient */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      </div>
    </motion.div>
  )
}

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <motion.div
        className="absolute top-1/2 left-0 w-96 h-96 bg-dine-orange/10 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={ref} className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Zap className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">All-in-One Platform</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
          >
            Everything You Need to{' '}
            <span className="gradient-text">Run Your Restaurant</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            From website creation to order management, bookings, and loyalty programs — 
            DineDesk connects every part of your restaurant operation in one seamless platform.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
