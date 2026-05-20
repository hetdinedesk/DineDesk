'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Star, MapPin, Clock, Phone } from 'lucide-react'

const themes = [
  {
    id: 'theme-d1',
    name: 'Signature',
    label: 'Fine Dining & Upscale',
    description: 'Sophisticated dark layout with elegant typography, full-width hero banners, and a reservation-forward design.',
    accent: '#c9a96e',
    bg: 'from-stone-900 to-stone-800',
    textColor: '#c9a96e',
    features: ['Full-width banner carousel', 'Reservation widget front & centre', 'Featured menu items', 'Specials & promotions section', 'Team / chef profiles', 'Custom page builder'],
    preview: {
      name: 'Bella Vista',
      tagline: 'Italian Fine Dining',
      nav: ['Menu', 'Reservations', 'About', 'Contact'],
      heroText: 'An Unforgettable Dining Experience',
      subText: 'Handcrafted Italian cuisine in the heart of the city',
      cta: 'Reserve a Table',
    },
  },
  {
    id: 'theme-d2',
    name: 'Casual',
    label: 'Café, Casual & Takeaway',
    description: 'Warm, inviting layout with large food imagery, prominently featured online ordering and a friendly, approachable feel.',
    accent: '#f97316',
    bg: 'from-orange-950 to-amber-900',
    textColor: '#f97316',
    features: ['Order online hero CTA', 'Menu categories with imagery', 'Promo tiles & specials', 'Location & hours prominent', 'Reviews section', 'QR ordering ready'],
    preview: {
      name: 'The Corner Café',
      tagline: 'Coffee & Kitchen',
      nav: ['Menu', 'Order Online', 'Find Us', 'About'],
      heroText: 'Good Food, Good Vibes',
      subText: 'Fresh food and great coffee — order online for pickup or delivery',
      cta: 'Order Now',
    },
  },
  {
    id: 'theme-d3',
    name: 'Modern',
    label: 'Modern, Trendy & Delivery-First',
    description: 'Sleek, high-contrast design built for digital-first restaurants. Ordering flow is front and centre, minimal distraction.',
    accent: '#a855f7',
    bg: 'from-violet-950 to-purple-900',
    textColor: '#a855f7',
    features: ['Dark mode design', 'Delivery / pickup toggle', 'Animated menu grid', 'Loyalty program widget', 'Multi-location selector', 'QR dine-in flow'],
    preview: {
      name: 'NOOD Bowls',
      tagline: 'Asian Fusion Kitchen',
      nav: ['Menu', 'Loyalty', 'Locations', 'Order'],
      heroText: 'Built for How People Eat Today',
      subText: 'Order ahead, dine in or get it delivered — your way',
      cta: 'Start Your Order',
    },
  },
]

function ThemeMockup({ theme }: { theme: typeof themes[0] }) {
  return (
    <div className={`bg-gradient-to-br ${theme.bg} rounded-xl overflow-hidden min-h-[340px] p-0`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/30">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <div className="flex-1 mx-3 bg-white/10 rounded px-2 py-0.5 text-xs text-white/40">
          {theme.preview.name.toLowerCase().replace(/ /g, '')}.dinedesk.app
        </div>
      </div>

      {/* Mock nav */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg" style={{ background: theme.accent }} />
          <span className="text-white font-bold text-sm">{theme.preview.name}</span>
        </div>
        <div className="hidden sm:flex gap-4">
          {theme.preview.nav.map((item) => (
            <span key={item} className="text-xs text-white/50">{item}</span>
          ))}
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full font-medium text-white"
          style={{ background: theme.accent }}
        >
          {theme.preview.cta}
        </div>
      </div>

      {/* Mock hero */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs font-semibold mb-1" style={{ color: theme.accent }}>
          {theme.preview.tagline}
        </p>
        <h3 className="text-xl font-display font-bold text-white mb-2 leading-snug">
          {theme.preview.heroText}
        </h3>
        <p className="text-sm text-white/50 mb-5 max-w-xs">{theme.preview.subText}</p>

        {/* Mock info row */}
        <div className="flex flex-wrap gap-3 mb-5">
          {[
            { icon: Clock, text: 'Mon–Sun 11am–10pm' },
            { icon: MapPin, text: '128 Main Street' },
            { icon: Phone, text: '(555) 012-3456' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-white/40">
              <Icon className="w-3 h-3" style={{ color: theme.accent }} />
              {text}
            </div>
          ))}
        </div>

        {/* Mock menu items */}
        <div className="grid grid-cols-3 gap-2">
          {['Bruschetta', 'Linguine', 'Tiramisu'].map((item, i) => (
            <div key={item} className="bg-white/5 rounded-lg p-2 text-center">
              <div className="w-full h-10 rounded mb-1.5" style={{ background: `${theme.accent}25` }} />
              <p className="text-xs text-white/70 font-medium">{item}</p>
              <p className="text-xs" style={{ color: theme.accent }}>${(12 + i * 4)}.00</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HomeThemesPreview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [active, setActive] = useState(themes[0])

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={ref} className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-sm font-semibold text-dine-orange uppercase tracking-widest mb-4"
          >
            Professional Themes
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5"
          >
            A Website That Fits{' '}
            <span className="gradient-text">Your Restaurant</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            We offer three professionally designed themes, each tailored to a different
            restaurant type. We build and configure your theme — you just approve and go live.
          </motion.p>
        </div>

        {/* Theme selector + preview */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left — theme list */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setActive(theme)}
                className={`w-full text-left p-5 rounded-xl transition-all duration-300 ${
                  active.id === theme.id
                    ? 'glass border border-dine-orange/40'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 mt-0.5"
                    style={{ background: `${theme.accent}30`, border: `1px solid ${theme.accent}50` }}
                  >
                    <div className="w-full h-full rounded-xl flex items-center justify-center">
                      <Star className="w-4 h-4" style={{ color: theme.accent }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-white">{theme.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">{theme.label}</span>
                    </div>
                    <p className="text-sm text-white/50 mb-3">{theme.description}</p>
                    {active.id === theme.id && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {theme.features.map((f) => (
                          <div key={f} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: theme.accent }} />
                            <span className="text-xs text-white/60">{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>

          {/* Right — live preview */}
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass rounded-2xl p-2 shadow-2xl"
            style={{ boxShadow: `0 0 60px ${active.accent}20` }}
          >
            <ThemeMockup theme={active} />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link
            href="/themes"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass text-white font-semibold hover:bg-white/10 transition-all group"
          >
            View All Theme Details
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
