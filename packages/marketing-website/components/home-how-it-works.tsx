'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { MessageSquare, Wrench, Eye, Rocket, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: MessageSquare,
    number: '01',
    title: 'You Contact Us',
    description: 'Fill in our form with your restaurant name, type, location and which features you need. No tech knowledge required — just tell us about your business.',
    detail: 'We ask about your menu, branding preferences, theme choice, ordering preferences and any special requirements. One conversation covers everything.',
    color: 'from-dine-orange to-dine-coral',
  },
  {
    icon: Wrench,
    number: '02',
    title: 'We Build Everything',
    description: 'Our team sets up your complete platform: website, CMS, menu, ordering system, reservations, loyalty program and all integrations.',
    detail: 'We configure Stripe, set up your tables, input your menu categories and items, connect your domain and prepare deployment. You do not touch a single file.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Eye,
    number: '03',
    title: 'You Review & Approve',
    description: 'We share a staging preview. You check every page, every menu item, every setting. Request changes and we handle them — as many rounds as needed.',
    detail: 'Nothing goes live until you are 100% satisfied. You can test the ordering flow, check QR codes, review the booking form and explore your CMS access.',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: Rocket,
    number: '04',
    title: 'Go Live & Take Control',
    description: 'Once approved, we deploy your site to your custom domain. You get full CMS access to update content, manage orders and run your business.',
    detail: 'From day one you can update menu items, add specials, change hours, manage bookings and view analytics. We remain available for support whenever you need.',
    color: 'from-green-500 to-emerald-500',
  },
]

export function HomeHowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy/20 to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-15" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={ref} className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-sm font-semibold text-dine-orange uppercase tracking-widest mb-4"
          >
            Simple Process
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5"
          >
            From Contact to Live{' '}
            <span className="gradient-text">in Days, Not Months</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            We handle all the technical work. You tell us what you need, review the result
            and approve it. That is it.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="group relative glass rounded-2xl p-6 card-hover"
            >
              {/* Step number */}
              <div className="text-6xl font-display font-black text-white/5 absolute top-4 right-5 leading-none select-none">
                {step.number}
              </div>

              {/* Icon */}
              <div className={`w-13 h-13 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg font-display font-bold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">{step.description}</p>
              <p className="text-xs text-white/35 leading-relaxed border-t border-white/10 pt-4">{step.detail}</p>

              {/* Connector line (desktop only, not last) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-3 w-6 z-10">
                  <ArrowRight className="w-5 h-5 text-white/20" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold btn-shine group"
          >
            Get Started — Tell Us About Your Restaurant
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
