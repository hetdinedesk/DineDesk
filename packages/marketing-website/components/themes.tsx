'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  Utensils,
  Coffee,
  Home,
  ArrowRight,
  Check,
  Layout,
  Settings,
  Image as ImageIcon,
  Link as LinkIcon,
  Phone,
  MapPin,
  Star,
  ShoppingBag
} from 'lucide-react'

const themes = [
  {
    id: 'theme-d1',
    name: 'Theme D1',
    icon: Utensils,
    description: 'Classic restaurant design with banner carousel, featured items, and promo tiles.',
    features: ['Banner carousel', 'Featured items section', 'Promo tiles', 'Reviews widget'],
    color: 'from-dine-orange to-dine-coral',
    bgColor: 'bg-gradient-to-br from-dine-orange/10 to-dine-coral/10',
  },
  {
    id: 'theme-d2',
    name: 'Theme D2',
    icon: Coffee,
    description: 'Modern layout with enhanced animations and interactive elements.',
    features: ['Smooth animations', 'Interactive elements', 'Cart integration', 'Loyalty widget'],
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-gradient-to-br from-blue-500/10 to-indigo-600/10',
  },
  {
    id: 'theme-d3',
    name: 'Theme D3',
    icon: Home,
    description: 'Clean, minimal design focused on content and quick navigation.',
    features: ['Minimal layout', 'Quick navigation', 'Mobile optimized', 'Fast loading'],
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-gradient-to-br from-green-500/10 to-emerald-600/10',
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
            Choose from 3 professionally designed themes. Each theme is fully customizable 
            with colors, fonts, and layouts to match your brand.
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

        {/* Customizable Colors Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-20 glass rounded-3xl p-8 border border-white/10"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-display font-bold text-white mb-3">
              Fully Customizable Colors
            </h3>
            <p className="text-white/60 max-w-2xl mx-auto">
              Every theme includes a color picker to customize your brand colors. Change primary accents,
              navigation colors, and background tones to match your restaurant's identity.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Primary Accent', color: 'from-dine-orange to-dine-coral' },
              { name: 'Navigation', color: 'from-blue-500 to-indigo-600' },
              { name: 'Background', color: 'from-slate-700 to-slate-900' },
              { name: 'Text', color: 'from-gray-100 to-gray-300' },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-4 text-center">
                <div className={`w-full h-16 rounded-lg bg-gradient-to-r ${item.color} mb-3`} />
                <p className="text-sm font-medium text-white">{item.name}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Header Types Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-16 glass rounded-3xl p-8 border border-white/10"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-display font-bold text-white mb-3 flex items-center justify-center gap-2">
              <Layout className="w-6 h-6 text-dine-orange" />
              Header Layout Options
            </h3>
            <p className="text-white/60 max-w-2xl mx-auto">
              Choose from 4 header layouts to match your brand and navigation needs.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Standard Full', desc: 'Logo left, nav centre, CTA right', icon: Layout },
              { name: 'Sticky', desc: 'Stays fixed at top while scrolling', icon: Settings },
              { name: 'Minimal', desc: 'Logo + hamburger menu only', icon: Home },
              { name: 'Split', desc: 'Logo centre, nav split left and right', icon: Layout },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <item.icon className="w-8 h-8 text-dine-orange mb-3" />
                <h4 className="font-semibold text-white mb-2">{item.name}</h4>
                <p className="text-xs text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Utility Belt Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="mt-16 glass rounded-3xl p-8 border border-white/10"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-display font-bold text-white mb-3 flex items-center justify-center gap-2">
              <Settings className="w-6 h-6 text-dine-orange" />
              Utility Belt
            </h3>
            <p className="text-white/60 max-w-2xl mx-auto">
              Enable optional header elements to display contact info, social links, reviews, and CTAs.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Contact Info', desc: 'Address, phone, hours', icon: Phone },
              { name: 'Social Links', desc: 'Instagram, Facebook, etc.', icon: LinkIcon },
              { name: 'Reviews', desc: 'Star ratings display', icon: Star },
              { name: 'Header CTAs', desc: 'Book now, order buttons', icon: ShoppingBag },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <item.icon className="w-8 h-8 text-dine-orange mb-3" />
                <h4 className="font-semibold text-white mb-2">{item.name}</h4>
                <p className="text-xs text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Logo Branding Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-16 glass rounded-3xl p-8 border border-white/10"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-display font-bold text-white mb-3 flex items-center justify-center gap-2">
              <ImageIcon className="w-6 h-6 text-dine-orange" />
              Logo & Branding
            </h3>
            <p className="text-white/60 max-w-2xl mx-auto">
              Upload your logo in light and dark variants, set your display name, and configure favicon.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Header Logo — Light', desc: 'For light-coloured headers', icon: ImageIcon },
              { name: 'Header Logo — Dark', desc: 'For dark-coloured headers', icon: ImageIcon },
              { name: 'Favicon', desc: 'Browser tab icon', icon: ImageIcon },
              { name: 'Display Name', desc: 'Restaurant name shown in header', icon: Settings },
              { name: 'Icons', desc: 'Custom app icons', icon: ImageIcon },
              { name: 'Logo Resizing', desc: 'Auto-resize for optimal display', icon: Settings },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <item.icon className="w-8 h-8 text-dine-orange mb-3" />
                <h4 className="font-semibold text-white mb-2">{item.name}</h4>
                <p className="text-xs text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTAs Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9 }}
          className="mt-16 glass rounded-3xl p-8 border border-white/10"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-display font-bold text-white mb-3 flex items-center justify-center gap-2">
              <LinkIcon className="w-6 h-6 text-dine-orange" />
              Calls to Action
            </h3>
            <p className="text-white/60 max-w-2xl mx-auto">
              Create internal or external CTAs with multiple button styles to drive conversions.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { name: 'Internal Link', desc: 'Link to pages on your site', icon: LinkIcon },
              { name: 'External Link', desc: 'Full URL, tel:, mailto:', icon: LinkIcon },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <item.icon className="w-8 h-8 text-dine-orange mb-3" />
                <h4 className="font-semibold text-white mb-2">{item.name}</h4>
                <p className="text-xs text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-white/50 mb-4">Button Variants:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-6 py-2 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-medium text-sm">
                Primary Button
              </button>
              <button className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-white font-medium text-sm">
                Secondary Button
              </button>
              <button className="px-6 py-2 rounded-full border border-dine-orange text-dine-orange font-medium text-sm">
                Outline Button
              </button>
              <button className="px-6 py-2 rounded-full text-dine-orange font-medium text-sm">
                Text Link
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
