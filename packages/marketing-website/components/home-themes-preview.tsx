'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Star, MapPin, Clock, Phone, ExternalLink } from 'lucide-react'

const themes = [
  {
    id: 'theme-d1',
    name: 'Classic',
    label: 'Café & Coffee Shops',
    description: 'Clean, content-rich layout with a prominent specials banner, loyalty & ordering CTAs in the hero, specials section, customer reviews and multi-location footer.',
    accent: '#c9a96e',
    bg: 'from-stone-900 to-stone-800',
    textColor: '#c9a96e',
    features: ['Specials announcement banner', 'Loyalty, Order & Book CTAs', 'Current specials section', 'Customer reviews section', 'Multi-location support', 'Meet the team page'],
    demoUrl: 'https://harbour-brew-cafe-theme-d1.netlify.app/',
    preview: {
      name: 'Harbour Brew Cafe',
      tagline: 'Coffee & Café · Sydney',
      nav: ['Menu', 'Specials', 'Locations', 'Contact'],
      heroText: 'Experience the Art of Coffee',
      subText: 'Fresh coffee, harbour views, and good vibes — order online or book a table',
      cta: 'Order Online',
    },
  },
  {
    id: 'theme-d2',
    name: 'Modern',
    label: 'Cafés & Casual Dining',
    description: 'Warmer, story-forward layout with a full-width hero, rich about section, specials tiles, customer reviews and prominent online ordering throughout.',
    accent: '#f97316',
    bg: 'from-orange-950 to-amber-900',
    textColor: '#f97316',
    features: ['Full hero with brand story', 'Order Online hero CTA', 'Specials & promotions tiles', 'Customer reviews section', 'Multi-location support', 'Meet the team page'],
    demoUrl: 'https://harbour-brew-cafe-theme-d2.netlify.app/',
    preview: {
      name: 'Harbour Brew Cafe',
      tagline: 'Coffee & Café · Circular Quay',
      nav: ['Menu', 'Specials', 'Locations', 'Contact'],
      heroText: 'Experience the Art of Coffee',
      subText: 'We source the finest beans from sustainable farms — crafted with passion, every cup',
      cta: 'Explore Our Menu',
    },
  },
  {
    id: 'theme-d3',
    name: 'Bold',
    label: 'Loyalty-First & Ordering-First',
    description: 'High-impact design with a seasonal announcement bar, integrated loyalty program widget on the homepage, specials section and streamlined online ordering flow.',
    accent: '#a855f7',
    bg: 'from-violet-950 to-purple-900',
    textColor: '#a855f7',
    features: ['Seasonal announcement bar', 'Loyalty program hero widget', 'Earn & redeem points display', 'Current specials section', 'Multi-location support', 'Meet the team page'],
    demoUrl: 'https://harbour-brew-cafe-theme-d3.netlify.app/',
    preview: {
      name: 'Harbour Brew Cafe',
      tagline: 'Coffee & Café · Sydney Harbour',
      nav: ['Menu', 'Specials', 'Locations', 'Contact'],
      heroText: 'Experience the Art of Coffee',
      subText: 'Try our new seasonal drinks and pastries — earn rewards with every order',
      cta: 'Join Loyalty Program',
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
          harbour-brew-cafe-{theme.id}.netlify.app
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
            { icon: Clock, text: 'Mon–Sun 6am–5pm' },
            { icon: MapPin, text: '123 George St, Sydney' },
            { icon: Phone, text: '+61 2 9123 4567' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-white/40">
              <Icon className="w-3 h-3" style={{ color: theme.accent }} />
              {text}
            </div>
          ))}
        </div>

        {/* Mock menu items */}
        <div className="grid grid-cols-3 gap-2">
          {['Flat White', 'Cold Brew', 'Pastry'].map((item, i) => (
            <div key={item} className="bg-white/5 rounded-lg p-2 text-center">
              <div className="w-full h-10 rounded mb-1.5" style={{ background: `${theme.accent}25` }} />
              <p className="text-xs text-white/70 font-medium">{item}</p>
              <p className="text-xs" style={{ color: theme.accent }}>${(5 + i * 2)}.50</p>
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
            Three Themes, One{' '}
            <span className="gradient-text">Real Demo Restaurant</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            See all three themes live on a real café — Harbour Brew Cafe, Sydney. Each theme
            uses the same content but delivers a completely different look and feel. We build
            and configure your theme — you just approve and go live.
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
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-1.5">
                          {theme.features.map((f) => (
                            <div key={f} className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: theme.accent }} />
                              <span className="text-xs text-white/60">{f}</span>
                            </div>
                          ))}
                        </div>
                        <a
                          href={theme.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                          style={{ color: theme.accent }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          See a live example
                        </a>
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
