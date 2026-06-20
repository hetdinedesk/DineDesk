'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  ExternalLink,
  Check,
  ArrowRight,
  Sparkles,
  Palette,
  Layout,
  Globe,
  Monitor,
  ShoppingBag,
  Star,
  Phone,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'

const themes = [
  {
    id: 'theme-d1',
    index: '01',
    name: 'Classic',
    tagline: 'Clean & Content-Rich',
    description:
      'A structured, editorial layout built around your content. The announcement banner keeps customers informed of specials the moment they land. Loyalty, Order and Book CTAs anchor the hero. A dedicated specials section, verified customer reviews, and a multi-location footer round out the experience.',
    accentColor: '#c9a96e',
    accentClass: 'from-amber-400 to-yellow-500',
    borderClass: 'border-amber-500/20 hover:border-amber-500/50',
    activeBorder: 'border-amber-500/60',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-400',
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
    index: '02',
    name: 'Modern',
    tagline: 'Story-Forward & Warm',
    description:
      'A warmer, brand-led layout that leads with your story. The full-width hero puts your identity front and centre. A rich about section, specials tiles, and customer reviews build trust — with prominent Order Online CTAs woven throughout so customers can act at any point.',
    accentColor: '#f97316',
    accentClass: 'from-orange-500 to-red-500',
    borderClass: 'border-orange-500/20 hover:border-orange-500/50',
    activeBorder: 'border-orange-500/60',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    dotClass: 'bg-orange-400',
    demoUrl: 'https://harbour-brew-cafe-theme-d2.netlify.app/',
    bestFor: 'Casual dining, restaurants with a strong brand identity',
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
    index: '03',
    name: 'Bold',
    tagline: 'Loyalty-First & High Impact',
    description:
      'A high-impact layout built for repeat customers. A seasonal announcement bar drives urgency. The loyalty program widget sits right on the homepage — customers can check their points and redeem rewards without leaving. A streamlined specials section and frictionless ordering flow complete the experience.',
    accentColor: '#a855f7',
    accentClass: 'from-violet-500 to-purple-600',
    borderClass: 'border-violet-500/20 hover:border-violet-500/50',
    activeBorder: 'border-violet-500/60',
    badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    dotClass: 'bg-violet-400',
    demoUrl: 'https://harbour-brew-cafe-theme-d3.netlify.app/',
    bestFor: 'Venues focused on repeat customers and direct online orders',
    highlights: [
      'Seasonal announcement bar',
      'Loyalty program homepage widget',
      'Earn & redeem points display',
      'Current specials section',
      'Multi-location support',
      'Meet the team page',
    ],
  },
]

const customisationItems = [
  { icon: Palette, title: 'Brand Colours', desc: 'Primary accent, navigation, background and text — all configured to match your brand.' },
  { icon: Layout, title: 'Header Layout', desc: 'Standard, sticky, minimal or split nav — choose what suits your restaurant.' },
  { icon: Globe, title: 'Custom Domain', desc: 'Connect your own domain. SSL included. We handle the full setup.' },
  { icon: Monitor, title: 'Fonts & Typography', desc: 'Curated font pairings that look professional on every screen size.' },
  { icon: ShoppingBag, title: 'CTA Buttons', desc: 'Order, book, loyalty and contact CTAs — label, colour and destination all configurable.' },
  { icon: Star, title: 'Google Reviews', desc: 'Connect your Google Business profile. Reviews pull in automatically.' },
  { icon: Phone, title: 'Contact & Hours', desc: 'Phone, address and trading hours shown in header, footer and contact page.' },
  { icon: MapPin, title: 'Multi-Location', desc: 'Add unlimited locations — each with its own hours, address and menu.' },
]

export function Themes() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [active, setActive] = useState(0)

  return (
    <section id="themes" className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy/10 to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── HEADER ── */}
        <div ref={ref} className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <Sparkles className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">Professional Themes</span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[0.95] mb-0">
                Three themes.<br />
                <span className="gradient-text">One real restaurant.</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
            >
              <p className="text-lg text-white/55 leading-relaxed mb-6">
                All three themes run live on{' '}
                <span className="text-white font-medium">Harbour Brew Cafe, Sydney</span> — a real
                DineDesk demo restaurant. Same menu, same content. Pick a layout that fits your brand.
              </p>
              <div className="flex flex-wrap gap-3">
                {themes.map((t) => (
                  <a
                    key={t.id}
                    href={t.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${t.badgeClass} hover:opacity-80`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t.name} — Live Demo
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── THREE THEMES — STACKED EDITORIAL ROWS ── */}
        <div className="space-y-6 mb-28">
          {themes.map((theme, i) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.1 }}
              onClick={() => setActive(i)}
              className={`group cursor-pointer glass rounded-2xl border transition-all duration-300 overflow-hidden ${
                active === i ? theme.activeBorder : `border-white/10 ${theme.borderClass}`
              }`}
            >
              {/* Top bar */}
              <div className={`h-0.5 w-full bg-gradient-to-r ${theme.accentClass} transition-opacity duration-300 ${active === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />

              <div className="p-8 md:p-10">
                <div className="grid md:grid-cols-12 gap-8 items-start">

                  {/* Index + name */}
                  <div className="md:col-span-3">
                    <p className="text-6xl font-display font-black text-white/5 mb-2 leading-none select-none">{theme.index}</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold mb-3 ${theme.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.dotClass}`} />
                      {theme.tagline}
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white">{theme.name}</h2>
                    <p className="text-white/40 text-sm mt-2">Best for: {theme.bestFor}</p>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-5">
                    <p className="text-white/65 leading-relaxed text-base">{theme.description}</p>
                  </div>

                  {/* Feature list */}
                  <div className="md:col-span-3">
                    <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">Includes</p>
                    <ul className="space-y-2.5">
                      {theme.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-dine-orange flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-white/65">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA col */}
                  <div className="md:col-span-1 flex md:flex-col items-center md:items-end justify-end gap-3">
                    <a
                      href={theme.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r ${theme.accentClass} text-white opacity-90 hover:opacity-100 whitespace-nowrap`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Live demo
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── CUSTOMISATION SECTION ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mb-24"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-start mb-14">
            <div>
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight">
                Every theme is<br />
                <span className="gradient-text">fully yours.</span>
              </h2>
            </div>
            <div>
              <p className="text-white/55 text-lg leading-relaxed">
                We configure your chosen theme to match your brand — colours, fonts, logo, domain,
                and content. You get full CMS access from day one. Change anything, anytime, without
                touching a single line of code.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {customisationItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.04 }}
                className="group glass border border-white/8 rounded-2xl p-6 hover:border-white/20 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-dine-orange/10 flex items-center justify-center mb-4 group-hover:bg-dine-orange/20 transition-colors">
                  <item.icon className="w-5 h-5 text-dine-orange" />
                </div>
                <h4 className="font-semibold text-white mb-2 text-sm">{item.title}</h4>
                <p className="text-white/45 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── BOTTOM CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="border-t border-white/10 pt-20"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm text-dine-orange font-semibold uppercase tracking-widest mb-4">Ready to go live?</p>
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight">
                We pick the theme,<br />build the site,<br />and launch it.
              </h2>
            </div>
            <div>
              <p className="text-white/55 text-lg leading-relaxed mb-8">
                Tell us about your restaurant. We'll recommend the right theme, configure it to your
                brand, and have you live within 7 business days. AUD 249 setup, then from $79/mo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold btn-shine"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://harbour-brew-cafe-theme-d1.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  See live demos
                </a>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
