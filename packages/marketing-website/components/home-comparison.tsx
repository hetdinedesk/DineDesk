'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, ArrowRight, TrendingDown, DollarSign } from 'lucide-react'

const rows = [
  {
    feature: 'Commission per order',
    yours: '$0 — flat monthly fee',
    theirs: '15–30% of every order',
  },
  {
    feature: 'Who owns the customer?',
    yours: 'You do — always',
    theirs: 'The platform does',
  },
  {
    feature: 'Your branding',
    yours: 'Your name, your domain',
    theirs: 'Their brand, their app',
  },
  {
    feature: 'Customer data & emails',
    yours: 'Full access, forever',
    theirs: 'Hidden from you',
  },
  {
    feature: 'Loyalty program',
    yours: 'Built in, yours to keep',
    theirs: 'Theirs — not yours',
  },
  {
    feature: 'Contracts',
    yours: 'No lock-in, cancel anytime',
    theirs: 'Platform sets the rules',
  },
  {
    feature: 'Setup',
    yours: 'We do everything for you',
    theirs: 'DIY or pay extra',
  },
]

export function HomeComparison() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy/30 to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-15" />
      <motion.div
        className="absolute top-1/3 right-0 w-96 h-96 bg-dine-coral/10 rounded-full blur-3xl"
        animate={{ x: [0, -60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={ref} className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-sm font-semibold text-dine-orange uppercase tracking-widest mb-4"
          >
            The Smarter Way to Take Orders Online
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6 leading-tight"
          >
            Stop Giving Away{' '}
            <span className="gradient-text">15–30% of Every Order</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Most online ordering platforms take a cut of every single sale. With your own
            ordering system, that commission stays in your pocket — every order, every day.
          </motion.p>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl overflow-hidden mb-8"
        >
          {/* Column Headers */}
          <div className="grid grid-cols-3 border-b border-white/10">
            <div className="p-4 sm:p-5" />
            <div className="p-4 sm:p-5 border-l border-white/10 bg-dine-orange/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-dine-orange flex-shrink-0" />
                <span className="font-display font-bold text-white text-sm sm:text-base">Your Own Platform</span>
              </div>
            </div>
            <div className="p-4 sm:p-5 border-l border-white/10">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-white/30 flex-shrink-0" />
                <span className="font-display font-bold text-white/50 text-sm sm:text-base">Third-Party Apps</span>
              </div>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, index) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 border-b border-white/5 last:border-0 ${index % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
            >
              <div className="p-4 sm:p-5">
                <span className="text-sm text-white/50 font-medium">{row.feature}</span>
              </div>
              <div className="p-4 sm:p-5 border-l border-white/10 bg-dine-orange/5">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white font-medium">{row.yours}</span>
                </div>
              </div>
              <div className="p-4 sm:p-5 border-l border-white/10">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/45">{row.theirs}</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Savings Callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-7 sm:p-8 mb-10 border border-dine-orange/20 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-dine-orange to-dine-coral" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-dine-orange to-dine-coral flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400 uppercase tracking-wide">Real Savings, Every Month</span>
              </div>
              <p className="text-white/80 text-base leading-relaxed">
                Most commission-based platforms charge{' '}
                <span className="text-red-400 font-bold">15–30% per order</span> — so on a
                $30 meal, you hand over up to $9 before you&apos;ve paid a single bill. With
                DineDesk, you pay a flat monthly fee.{' '}
                <span className="text-white font-bold">Just two orders a day covers it.</span>{' '}
                Everything after that is yours — no cuts, no surprises.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold btn-shine group text-lg"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
