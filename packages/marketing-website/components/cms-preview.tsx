'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  LayoutDashboard, 
  Utensils, 
  Pencil, 
  Settings, 
  ShoppingCart,
  Users,
  Image,
  MapPin,
  Check,
  Sparkles
} from 'lucide-react'

const cmsSections = [
  { name: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
  { name: 'Menu Items', icon: Utensils, color: 'text-dine-orange' },
  { name: 'CMS', icon: Pencil, color: 'text-purple-400' },
  { name: 'Operations', icon: ShoppingCart, color: 'text-green-400' },
  { name: 'Config', icon: Settings, color: 'text-gray-400' },
]

const stats = [
  { label: 'Menu Items', value: '156', change: '+12' },
  { label: "Today's Orders", value: '47', change: '+8' },
  { label: 'Revenue', value: '$2.4k', change: '+15%' },
]

export function CmsPreview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="order-2 lg:order-1"
          >
            <div className="glass rounded-2xl p-2 glow-orange">
              <div className="bg-dine-dark rounded-xl overflow-hidden">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dine-orange to-dine-coral flex items-center justify-center">
                      <span className="text-white font-bold text-sm">D</span>
                    </div>
                    <span className="font-display font-bold text-white">DineDesk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                  </div>
                </div>
                
                <div className="flex">
                  {/* Sidebar */}
                  <div className="w-16 border-r border-white/10 p-2 space-y-2">
                    {cmsSections.map((section) => (
                      <div
                        key={section.name}
                        className={`w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                          section.name === 'Dashboard' ? 'bg-dine-orange/20' : 'hover:bg-white/5'
                        }`}
                      >
                        <section.icon className={`w-5 h-5 ${section.color}`} />
                      </div>
                    ))}
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 p-4">
                    {/* Page Title */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-display font-bold text-white">Dashboard</h3>
                      <span className="text-xs text-white/50">Bella Vista Restaurant</span>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {stats.map((stat) => (
                        <div key={stat.label} className="glass rounded-lg p-3">
                          <p className="text-xs text-white/50">{stat.label}</p>
                          <p className="text-lg font-bold text-white">{stat.value}</p>
                          <p className="text-xs text-green-400">{stat.change}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Live Orders */}
                    <div className="glass rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-white">Live Orders</p>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">3 Active</span>
                      </div>
                      
                      <div className="space-y-2">
                        {[
                          { id: '#2341', status: 'Preparing', color: 'bg-yellow-500' },
                          { id: '#2340', status: 'Ready', color: 'bg-green-500' },
                          { id: '#2339', status: 'New', color: 'bg-blue-500' },
                        ].map((order) => (
                          <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${order.color} animate-pulse`} />
                              <span className="text-sm text-white">Order {order.id}</span>
                            </div>
                            <span className="text-xs text-white/50">{order.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content */}
          <div ref={ref} className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Sparkles className="w-4 h-4 text-dine-orange" />
              <span className="text-sm text-white/80">Powerful Admin Panel</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
            >
              Manage Everything from{' '}
              <span className="gradient-text">One Dashboard</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/60 mb-8"
            >
              Your complete command center for menus, orders, bookings, loyalty programs, 
              staff access, analytics, and more. Designed for restaurant owners, not tech experts.
            </motion.p>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="grid sm:grid-cols-2 gap-4"
            >
              {[
                { icon: Utensils, title: 'Menu Management', desc: 'Add items, variants, photos' },
                { icon: ShoppingCart, title: 'Order Management', desc: 'Real-time order tracking' },
                { icon: Users, title: 'Team Access', desc: 'Role-based permissions' },
                { icon: Image, title: 'Content Editor', desc: 'WYSIWYG page builder' },
                { icon: MapPin, title: 'Locations', desc: 'Multi-location support' },
                { icon: Settings, title: 'Integrations', desc: 'Stripe, GA4, SendGrid' },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-dine-orange/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-dine-orange" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{feature.title}</p>
                    <p className="text-white/50 text-xs">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
