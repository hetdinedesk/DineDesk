'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { 
  Utensils, 
  Coffee, 
  Truck, 
  Home, 
  TrendingUp, 
  Package,
  ArrowRight,
  Check
} from 'lucide-react'

const themes = [
  {
    id: 'fine-dining',
    name: 'Fine Dining',
    icon: Utensils,
    description: 'Elegant, sophisticated design for upscale restaurants.',
    features: ['Elegant typography', 'High-quality imagery', 'Reservation focus', 'Wine list integration'],
    color: 'from-amber-600 to-orange-700',
    bgColor: 'bg-gradient-to-br from-amber-900/20 to-orange-900/20',
  },
  {
    id: 'cafe',
    name: 'Café',
    icon: Coffee,
    description: 'Warm, inviting design perfect for coffee shops and bakeries.',
    features: ['Cozy atmosphere', 'Menu highlights', 'Hours prominently', 'Instagram integration'],
    color: 'from-amber-500 to-yellow-600',
    bgColor: 'bg-gradient-to-br from-amber-900/20 to-yellow-900/20',
  },
  {
    id: 'food-truck',
    name: 'Food Truck',
    icon: Truck,
    description: 'Bold, vibrant design for mobile food businesses.',
    features: ['Bold colors', 'Location tracker', 'Daily specials', 'Social media ready'],
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-gradient-to-br from-red-900/20 to-rose-900/20',
  },
  {
    id: 'casual',
    name: 'Casual Dining',
    icon: Home,
    description: 'Friendly, approachable design for family restaurants.',
    features: ['Family-friendly', 'Easy navigation', 'Kids menu', 'Group booking'],
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-gradient-to-br from-green-900/20 to-emerald-900/20',
  },
  {
    id: 'modern',
    name: 'Modern Trendy',
    icon: TrendingUp,
    description: 'Sleek, contemporary design for trendy eateries.',
    features: ['Minimalist design', 'Smooth animations', 'Dark mode option', 'Storytelling layout'],
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-gradient-to-br from-purple-900/20 to-violet-900/20',
  },
  {
    id: 'delivery',
    name: 'Delivery First',
    icon: Package,
    description: 'Optimized for delivery and takeout businesses.',
    features: ['Order-focused', 'Quick checkout', 'Delivery zones', 'Promo integration'],
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-gradient-to-br from-blue-900/20 to-cyan-900/20',
  },
]

export function Themes() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeTheme, setActiveTheme] = useState(themes[0])

  return (
    <section id="themes" className="relative py-32 overflow-hidden">
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
            <span className="text-sm text-white/80">Professional Themes</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
          >
            Stunning Themes for{' '}
            <span className="gradient-text">Every Restaurant</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Choose from professionally designed themes that match your restaurant's 
            personality and style. Each theme is fully customizable.
          </motion.p>
        </div>

        {/* Theme Selector */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Theme List */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            className="space-y-4"
          >
            {themes.map((theme, index) => (
              <motion.button
                key={theme.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveTheme(theme)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                  activeTheme.id === theme.id
                    ? 'glass border-dine-orange/50'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.color} flex items-center justify-center`}>
                    <theme.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-white">{theme.name}</h3>
                    <p className="text-sm text-white/50">{theme.description}</p>
                  </div>
                  <ArrowRight className={`w-5 h-5 transition-transform ${
                    activeTheme.id === theme.id ? 'text-dine-orange translate-x-1' : 'text-white/30'
                  }`} />
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Theme Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="glass rounded-2xl p-2 glow-orange">
              <div className={`${activeTheme.bgColor} rounded-xl overflow-hidden min-h-[400px] p-6`}>
                {/* Mock Website Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeTheme.color}`} />
                    <span className="font-display font-bold text-white">{activeTheme.name}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-white/60">
                    <span>Menu</span>
                    <span>About</span>
                    <span>Contact</span>
                  </div>
                </div>
                
                {/* Mock Hero */}
                <div className="text-center mb-8">
                  <h4 className="text-2xl font-display font-bold text-white mb-2">
                    Welcome to {activeTheme.name}
                  </h4>
                  <p className="text-white/60 text-sm">Experience the best dining in town</p>
                </div>
                
                {/* Mock Features */}
                <div className="grid grid-cols-2 gap-4">
                  {activeTheme.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 glass rounded-lg p-3">
                      <Check className="w-4 h-4 text-dine-orange" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Mock CTA */}
                <div className="mt-8 text-center">
                  <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${activeTheme.color} text-white font-medium`}>
                    Order Online
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 glass rounded-full flex items-center justify-center"
              animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <span className="text-2xl">🎨</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
