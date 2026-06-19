'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: 'How long does setup take?',
    answer: 'Most restaurants go live within 3-5 business days. We handle all technical work — you just provide your menu details, branding preferences, and any specific requirements. We share a staging preview for your approval before going live.',
  },
  {
    question: 'What\'s included in the one-time setup fee?',
    answer: 'The AUD 249 setup fee includes complete platform setup: website configuration, menu import, Stripe payment integration, QR code generation for tables, domain connection, loyalty program setup, and full onboarding. You get a fully functional site ready to take orders.',
  },
  {
    question: 'Do I own my data?',
    answer: 'Yes, absolutely. All your data — menu items, customer information, orders, reviews — belongs to you. We provide export functionality at any time. You can move to another platform whenever you want.',
  },
  {
    question: 'Can I update my menu and content myself?',
    answer: 'Yes. After launch, you get full CMS access to update menu items, prices, descriptions, images, specials, hours, and more. No technical skills required — if you can use Facebook, you can use DineDesk.',
  },
  {
    question: 'What payment methods do you support?',
    answer: 'We use Stripe for all payments. Your customers can pay with credit/debit cards, Apple Pay, Google Pay, and other digital wallets. Stripe handles PCI compliance so you don\'t need to worry about security.',
  },
  {
    question: 'Do I need my own domain?',
    answer: 'No, but we recommend it. We can provide a free subdomain (yourrestaurant.dinedesk.app) or connect your existing domain. If you need a new domain, we can help you register one for a small additional fee.',
  },
  {
    question: 'What if I need support?',
    answer: 'We provide ongoing support via email and phone. We\'re Australian-based and understand local restaurant needs. Setup includes training on using the CMS, and we\'re available for questions whenever you need help.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, there are no lock-in contracts. You can cancel your monthly subscription at any time. Your data remains yours and can be exported if you decide to leave.',
  },
  {
    question: 'How do QR table ordering work?',
    answer: 'We generate unique QR codes for each table. Customers scan to view your menu, place orders, and pay — all from their phone. Orders appear in your CMS in real-time. No apps required for customers.',
  },
  {
    question: 'Do you handle reservations?',
    answer: 'Yes. Our reservation system lets customers book tables online. You can set capacity, time slots, and manage bookings from the CMS. Customers receive confirmation emails and reminders.',
  },
]

export function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy/20 to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-15" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <HelpCircle className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">FAQ</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5"
          >
            Frequently Asked{' '}
            <span className="gradient-text">Questions</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Everything you need to know about DineDesk. Can\'t find what you\'re looking for?{' '}
            <a href="/contact" className="text-dine-orange hover:underline">Contact us</a>.
          </motion.p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass rounded-2xl overflow-hidden border border-white/10"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="text-white font-medium pr-8">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-dine-orange transition-transform flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-6 pb-6 pt-0"
                >
                  <p className="text-white/60 leading-relaxed">{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-white/40 text-sm mb-4">Still have questions?</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold btn-shine"
          >
            Get in Touch
          </a>
        </motion.div>
      </div>
    </section>
  )
}
