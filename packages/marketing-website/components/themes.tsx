'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  ExternalLink,
  Check,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Palette,
  Layout,
  Star,
  ShoppingBag,
  MapPin,
  Phone,
  Globe,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

const themes = [
  {
    id: 'theme-d1',
    name: 'Classic',
    tagline: 'Clean & Content-Rich',
    description:
      'A structured, content-first layout. Specials announcement banner at the top, prominent loyalty & ordering CTAs in the hero, a current specials section, customer reviews, and a multi-location footer.',
    accentColor: '#c9a96e',
    accentClass: 'from-amber-500 to-yellow-600',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    demoUrl: 'https://harbour-brew-cafe-theme-d1.netlify.app/',
    bestFor: 'Cafés, brunch spots, multi-location venues',
    highlights: [
      'Specials announcement banner',
      'Loyalty, Order & Book hero CTAs',
      'Current specials section',
      'Customer reviews carousel',
      'Multi-location footer',
      'Meet the team page',
    ],
  },
  {
    id: 'theme-d2',
    name: 'Modern',
    tagline: 'Story-Forward & Warm',
    description:
      'A warmer, brand-led layout. Full-width hero with your story front and centre, rich about section, specials tiles, customer reviews, and prominent order online CTAs throughout the page.',
    accentColor: '#f97316',
    accentClass: 'from-orange-500 to-red-500',
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    demoUrl: 'https://harbour-brew-cafe-theme-d2.netlify.app/',
    bestFor: 'Casual dining, restaurants with a strong brand story',
    highlights: [
      'Full-width hero with brand story',
      'Order Online hero CTA',
      'Specials & promotions tiles',
      'Customer reviews section',
      'Multi-location support',
      'Meet the team page',
    ],
  },
  {
    id: 'theme-d3',
    name: 'Bold',
    tagline: 'Loyalty-First & High Impact',
    description:
      'A high-impact, conversion-focused layout. Seasonal announcement bar, an integrated loyalty program widget right on the homepage, specials section, and a streamlined online ordering flow.',
    accentColor: '#a855f7',
    accentClass: 'from-violet-500 to-purple-600',
    badgeClass: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    demoUrl: 'https://harbour-brew-cafe-theme-d3.netlify.app/',
    bestFor: 'Venues focused on repeat customers and online orders',
    highlights: [
      'Seasonal announcement bar',
      'Loyalty program hero widget',
      'Earn & redeem points display',
      'Current specials section',
      'Multi-location support',
      'Meet the team page',
    ],
  },
]

const allFeatureRows = [
  { label: 'Specials announcement banner', d1: true, d2: false, d3: true },
  { label: 'Loyalty hero widget', d1: false, d2: false, d3: true },
  { label: 'Order & Book hero CTAs', d1: true, d2: true, d3: true },
  { label: 'Brand story / about section', d1: false, d2: true, d3: false },
  { label: 'Current specials tiles', d1: true, d2: true, d3: true },
  { label: 'Customer reviews carousel', d1: true, d2: true, d3: false },
  { label: 'Meet the team page', d1: true, d2: true, d3: true },
  { label: 'Multi-location footer', d1: true, d2: true, d3: true },
]

const customisationItems = [
  {
    icon: Palette,
    title: 'Brand Colours',
    desc: 'Primary accent, nav, background and text colours — all configurable from the CMS.',
  },
  {
    icon: Layout,
    title: 'Header Layout',
    desc: 'Standard, sticky, minimal, or split — choose the nav style that suits your brand.',
  },
  {
    icon: Globe,
    title: 'Custom Domain',
    desc: 'Connect your own domain (yourrestaurant.com.au). SSL included, we set it up.',
  },
  {
    icon: Monitor,
    title: 'Fonts & Typography',
    desc: 'Pick from curated font pairings that look great on any device.',
  },
  {
    icon: ShoppingBag,
    title: 'CTA Buttons',
    desc: 'Configure order, book, loyalty and contact CTAs — colour, label, destination.',
  },
  {
    icon: Star,
    title: 'Google Reviews',
    desc: 'Connect your Google Business profile. Reviews pull in and display automatically.',
  },
  {
    icon: Phone,
    title: 'Contact & Hours',
    desc: 'Phone, address, trading hours — shown in header, footer and contact page.',
  },
  {
    icon: MapPin,
    title: 'Multi-Location',
    desc: 'Add unlimited locations. Each gets its own hours, address and menu.',
  },
]

export function Themes() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [active, setActive] = useState(0)
  const theme = themes[active]

  return (
    <section id="themes" className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy/20 to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── HEADER ── */}
        <div ref={ref} className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Sparkles className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">Three Live Themes</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-5"
          >
            Same restaurant.<br />
            <span className="gradient-text">Three completely different sites.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/55 max-w-2xl mx-auto"
          >
            All three themes are live on{' '}
            <span className="text-white font-medium">Harbour Brew Cafe, Sydney</span> — a real
            DineDesk demo restaurant. Same content, same menu, same features. Just pick your layout.
          </motion.p>
        </div>

        {/* ── THEME TABS ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25 }}
          className="flex justify-center gap-3 mb-10 flex-wrap"
        >
          {themes.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActive(i)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                active === i
                  ? 'bg-dine-orange text-white border-dine-orange shadow-lg shadow-dine-orange/25'
                  : 'glass border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {t.name}
            </button>
          ))}
        </motion.div>

        {/* ── MAIN PREVIEW PANEL ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={theme.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="grid lg:grid-cols-5 gap-8 mb-16"
          >
            {/* Left — iframe preview */}
            <div className="lg:col-span-3">
              <div className="glass rounded-2xl overflow-hidden border border-white/10">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 mx-3 bg-white/5 rounded-md px-3 py-1 text-xs text-white/30 font-mono truncate">
                    harbour-brew-cafe-{theme.id}.netlify.app
                  </div>
                  <a
                    href={theme.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                {/* iframe */}
                <div className="relative w-full" style={{ paddingBottom: '66%' }}>
                  <iframe
                    src={theme.demoUrl}
                    title={`${theme.name} theme demo`}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
              <a
                href={theme.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm text-dine-orange hover:opacity-80 transition-opacity font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open full demo in new tab
              </a>
            </div>

            {/* Right — theme info */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${theme.badgeClass} mb-3`}>
                  {theme.tagline}
                </span>
                <h2 className="text-3xl font-display font-bold text-white mb-2">{theme.name}</h2>
                <p className="text-white/55 leading-relaxed text-sm">{theme.description}</p>
              </div>

              <div className="glass rounded-xl p-4 border border-white/10">
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Best for</p>
                <p className="text-white/80 text-sm">{theme.bestFor}</p>
              </div>

              <div className="glass rounded-xl p-4 border border-white/10">
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">What's in this layout</p>
                <ul className="space-y-2">
                  {theme.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2.5 text-sm text-white/70">
                      <Check className="w-4 h-4 text-dine-orange flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={theme.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold flex items-center justify-center gap-2 btn-shine"
              >
                See {theme.name} Live
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Prev / Next */}
              <div className="flex gap-3">
                <button
                  onClick={() => setActive((active + 2) % 3)}
                  className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-white/50 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {themes[(active + 2) % 3].name}
                </button>
                <button
                  onClick={() => setActive((active + 1) % 3)}
                  className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-white/50 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {themes[(active + 1) % 3].name}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── ALL THREE THUMBNAILS ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-2xl font-display font-bold text-white text-center mb-8">
            All three themes at a glance
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {themes.map((t, i) => (
              <button
                key={t.id}
                onClick={() => { setActive(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className={`group text-left glass rounded-2xl overflow-hidden border transition-all ${
                  active === i ? 'border-dine-orange/50 glow-orange' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="relative w-full bg-black" style={{ paddingBottom: '62%' }}>
                  <iframe
                    src={t.demoUrl}
                    title={`${t.name} thumbnail`}
                    className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                    style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                  />
                  {active === i && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-dine-orange flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-white">{t.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${t.badgeClass}`}>{t.tagline}</span>
                  </div>
                  <p className="text-white/50 text-xs line-clamp-2">{t.bestFor}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── FEATURE COMPARISON TABLE ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mb-20"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-white mb-3">Layout differences at a glance</h2>
            <p className="text-white/50">Every theme shares the same core pages — these are the layout-specific sections.</p>
          </div>
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-white/40 text-sm font-medium">Section</th>
                  {themes.map((t) => (
                    <th key={t.id} className="px-4 py-4 text-center text-sm font-semibold text-white">{t.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatureRows.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-3.5 text-white/70 text-sm">{row.label}</td>
                    {[row.d1, row.d2, row.d3].map((val, j) => (
                      <td key={j} className="px-4 py-3.5 text-center">
                        {val ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── CUSTOMISATION GRID ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-white mb-3">Every theme is fully yours</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              We configure everything to match your brand. You own the CMS and can update anything, anytime.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {customisationItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="glass border border-white/10 rounded-xl p-5 hover:border-dine-orange/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-dine-orange/15 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-dine-orange" />
                </div>
                <h4 className="font-semibold text-white mb-1.5 text-sm">{item.title}</h4>
                <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── BOTTOM CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="glass border border-dine-orange/20 rounded-3xl p-10 text-center"
        >
          <h2 className="text-3xl font-display font-bold text-white mb-3">
            We pick the theme, build the site, and go live.
          </h2>
          <p className="text-white/55 max-w-xl mx-auto mb-8">
            Tell us your restaurant — we'll recommend the right theme, configure it to your brand, and have you live within 7 days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold btn-shine"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://harbour-brew-cafe-theme-d1.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full glass border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Browse Live Demos
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
