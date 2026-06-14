'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, Sparkles, ArrowRight, Building2, Store, Truck } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    icon: Truck,
    description: 'For small cafés, takeaway shops, and fish & chips stores.',
    price: 'AUD 79',
    period: '/mo',
    features: [
      'Restaurant website',
      'Menu and category management',
      'Specials and promotions',
      'Custom pages',
      'Theme colours and fonts',
      'Navigation, header, and footer',
      'Preview and live deployment',
      'Custom domain connection',
      'Basic SEO / meta data',
      'Basic support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Growth',
    icon: Store,
    description: 'For busy independents that want more control and better presentation.',
    price: 'AUD 149',
    period: '/mo',
    features: [
      'Everything in Starter, plus:',
      'Reviews carousel',
      'Better homepage sections and banners',
      'More design customisation',
      'Team members section',
      'QR table generation',
      'Priority support',
      'Extra content flexibility',
      'Stronger branding options',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Pro',
    icon: Building2,
    description: 'For restaurants that want revenue features and multi-location readiness.',
    price: 'AUD 249',
    period: '/mo',
    features: [
      'Everything in Growth, plus:',
      'Online ordering',
      'Loyalty program',
      'Booking & table reservations',
      'Multi-location support',
      'Advanced roles and permissions',
      'Premium customisation',
      'Higher-priority support',
      'Square POS integration for in-store sync',
    ],
    cta: 'Get Started',
    popular: false,
  },
]

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy/30 to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={ref} className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Sparkles className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">Transparent Pricing</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
          >
            DineDesk{' '}
            <span className="gradient-text">Pricing</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Simple, honest pricing for every type of restaurant.
            Pick the plan that fits your needs — no hidden fees, no lock-in contracts.
          </motion.p>
        </div>

        {/* Setup Fee Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25 }}
          className="glass border border-dine-orange/30 rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dine-orange to-dine-coral flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-display font-bold text-lg">One-Time Setup Fee — AUD 249</p>
              <p className="text-white/55 text-sm">Includes onboarding, menu import, domain connection, and launch setup.</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="px-4 py-2 rounded-full bg-dine-orange/15 text-dine-orange text-sm font-medium border border-dine-orange/30">
              Paid once at start
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.12 }}
              className={`relative rounded-2xl ${
                plan.popular
                  ? 'glass border-2 border-dine-orange/50 glow-orange'
                  : 'glass'
              } p-8 flex flex-col`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white text-sm font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl ${
                plan.popular
                  ? 'bg-gradient-to-br from-dine-orange to-dine-coral'
                  : 'bg-white/10'
              } flex items-center justify-center mb-5`}>
                <plan.icon className="w-7 h-7 text-white" />
              </div>

              {/* Plan name + description */}
              <h3 className="text-2xl font-display font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-white/50 text-sm mb-5 leading-relaxed">{plan.description}</p>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-display font-bold text-white">{plan.price}</span>
                  <span className="text-white/50 mb-1.5">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full ${
                      plan.popular ? 'bg-dine-orange/20' : 'bg-white/10'
                    } flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Check className={`w-3 h-3 ${
                        plan.popular ? 'text-dine-orange' : 'text-white/60'
                      }`} />
                    </div>
                    <span className={`text-sm ${i === 0 && feature.startsWith('Everything') ? 'text-white/40 italic' : 'text-white/70'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/contact"
                className={`w-full py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-dine-orange to-dine-coral text-white btn-shine'
                    : 'glass text-white hover:bg-white/10'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-white/40 text-sm">
            All plans require the one-time AUD 249 setup fee. Monthly subscription billed after launch.
            <br />
            No lock-in contracts — cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
