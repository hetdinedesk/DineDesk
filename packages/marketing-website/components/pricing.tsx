'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, Sparkles, ArrowRight, Building2, Store, Truck } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    icon: Truck,
    description: 'Perfect for food trucks and small cafes',
    price: '$99',
    period: '/month',
    features: [
      'Professional website with 1 theme',
      'Online ordering (pickup & delivery)',
      'Up to 50 menu items',
      'Basic analytics',
      'Email support',
      'SSL certificate',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Growth',
    icon: Store,
    description: 'For growing restaurants ready to scale',
    price: '$199',
    period: '/month',
    features: [
      'Everything in Starter, plus:',
      'QR table ordering',
      'Table reservations & booking',
      'Loyalty program',
      'Unlimited menu items',
      'Staff access control (3 users)',
      'Priority support',
      'Custom domain',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    icon: Building2,
    description: 'For multi-location restaurants & chains',
    price: 'Custom',
    period: '',
    features: [
      'Everything in Growth, plus:',
      'Multi-location management',
      'Unlimited staff accounts',
      'White-label options',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
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
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Sparkles className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">Simple Pricing</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
          >
            Plans for Every{' '}
            <span className="gradient-text">Restaurant</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            No hidden fees. No setup costs. Cancel anytime. 
            We build and launch your website — you just pay the monthly subscription.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`relative rounded-2xl ${
                plan.popular
                  ? 'glass border-2 border-dine-orange/50 glow-orange'
                  : 'glass'
              } p-8`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl ${
                plan.popular
                  ? 'bg-gradient-to-br from-dine-orange to-dine-coral'
                  : 'bg-white/10'
              } flex items-center justify-center mb-6`}>
                <plan.icon className="w-7 h-7 text-white" />
              </div>

              {/* Plan Info */}
              <h3 className="text-2xl font-display font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-white/50 text-sm mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-display font-bold text-white">{plan.price}</span>
                <span className="text-white/50">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full ${
                      plan.popular ? 'bg-dine-orange/20' : 'bg-white/10'
                    } flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Check className={`w-3 h-3 ${
                        plan.popular ? 'text-dine-orange' : 'text-white/60'
                      }`} />
                    </div>
                    <span className="text-white/70 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="#contact"
                className={`w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-dine-orange to-dine-coral text-white btn-shine'
                    : 'glass text-white hover:bg-white/10'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>

        {/* Trust Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-white/50 text-sm">
            All plans include: Website setup, menu configuration, SSL certificate, and hosting. 
            <br />
            No long-term contracts. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
