'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Check, Sparkles, ArrowRight, Rocket, Plus, Minus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    id: 'essential',
    name: 'Essential',
    title: 'Get Online.',
    description: "For cafés, takeaways, and small independents that need a professional web presence without the complexity.",
    price: '79',
    period: '/mo',
    save: 'Less than $20 a week',
    features: [
      'Professional restaurant website',
      'Menu and category management',
      'Specials and promotions',
      'Custom pages (About, Contact, etc.)',
      'Theme colours, fonts, branding',
      'Custom domain connection',
      'Mobile optimised',
      'Basic SEO and meta data',
      'Preview and live deployment',
      'Same-day support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    title: 'Get Customers.',
    description: 'For busy independents that want their website to actively bring in bookings and repeat customers.',
    price: '149',
    period: '/mo',
    save: 'Two extra bookings covers it',
    features: [
      'Online reservations & table bookings',
      'Google Reviews carousel',
      'Homepage banners & promotional sections',
      'QR code menu for tables',
      'Team / staff section',
      'Stronger branding & design options',
      'Extra content flexibility',
      'Same-day support',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    title: 'Get Revenue.',
    description: 'For restaurants ready to take orders directly, build loyalty, and stop paying commission to third-party apps.',
    price: '249',
    period: '/mo',
    save: 'One week of orders pays for itself',
    features: [
      'Online ordering (0% commission)',
      'Loyalty program with rewards',
      'Multi-location support',
      'Advanced roles & permissions',
      'Square POS integration',
      'Premium customisation',
      'Same-day support',
    ],
    cta: 'Get Started',
    popular: false,
  },
]

const roiCards = [
  {
    plan: 'Essential — $79/mo',
    claim: 'Less than $20 a week for a site you never have to touch.',
    detail: "A professional managed website costs less than a single sponsored post. You get a full online presence, kept up to date, forever.",
  },
  {
    plan: 'Growth — $149/mo',
    claim: 'Two extra bookings a month and it\'s paid for.',
    detail: "Online reservations capture customers who won't call. Two extra table bookings a month at $35 average spend per head covers the plan entirely.",
  },
  {
    plan: 'Pro — $249/mo',
    claim: 'One week of direct orders vs. paying commissions.',
    detail: "At 25–30% commission on a $300/day order volume, you're handing over $2,000–$2,700 a month to third-party apps. Direct ordering through DineDesk costs $249.",
  },
]

const compareFeatures = [
  { name: 'Professional restaurant website', essential: true, growth: true, pro: true },
  { name: 'Menu & category management', essential: true, growth: true, pro: true },
  { name: 'Specials & promotions', essential: true, growth: true, pro: true },
  { name: 'Custom domain & SSL', essential: true, growth: true, pro: true },
  { name: 'Mobile optimised', essential: true, growth: true, pro: true },
  { name: 'Basic SEO & meta data', essential: true, growth: true, pro: true },
  { name: 'Online reservations & bookings', essential: false, growth: true, pro: true },
  { name: 'Google Reviews carousel', essential: false, growth: true, pro: true },
  { name: 'QR code table menu', essential: false, growth: true, pro: true },
  { name: 'Homepage banners & promotions', essential: false, growth: true, pro: true },
  { name: 'Online ordering (0% commission)', essential: false, growth: false, pro: true },
  { name: 'Loyalty program', essential: false, growth: false, pro: true },
  { name: 'Multi-location support', essential: false, growth: false, pro: true },
  { name: 'Square POS integration', essential: false, growth: false, pro: true },
  { name: 'Support response time', essential: 'Same day', growth: 'Same day', pro: 'Same day' },
]

const faqs = [
  {
    q: 'What does the $249 setup fee cover?',
    a: "Everything. We build your complete website, import your full menu, set up your chosen features, connect your domain, configure SSL, and handle the launch. You don't touch a single file. Most web agencies charge $2,000–$5,000 for this. We charge $249 because we're efficient and we want a long-term client, not a one-off job.",
  },
  {
    q: 'Do I have to sign a long-term contract?',
    a: 'No lock-in contracts. We ask for a 3-month minimum to give the site time to properly launch, index in Google, and show results — but after that, it\'s month-to-month and you can cancel anytime.',
  },
  {
    q: 'How long does setup take?',
    a: 'Most restaurants are live within 5–10 business days of onboarding. We move fast once you\'ve sent us your menu, logo, and any photos. We\'ll share a staging preview before anything goes public — you approve, then we go live.',
  },
  {
    q: 'Can I update my own menu and content?',
    a: 'Yes — you get full CMS access from day one. Update menu items, prices, specials, hours, and photos yourself anytime. If you\'d rather not, we can handle updates for you as part of your monthly plan.',
  },
  {
    q: 'Do I need my own domain?',
    a: "If you already have a domain (e.g. yourrestaurant.com.au), we'll connect it for you. If you don't have one, we'll help you purchase and set one up — usually $15–25/year through a registrar like Crazy Domains or VentraIP.",
  },
  {
    q: 'Which plan should I start on?',
    a: "Most restaurants start on Growth ($149/mo). The online reservations feature alone typically pays for it within the first month. Start on Essential if you genuinely just need a web presence right now and nothing else — you can always upgrade later.",
  },
]

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <section id="pricing" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy/30 to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div ref={ref} className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-sm font-semibold text-dine-orange uppercase tracking-widest mb-4"
          >
            Simple, Transparent Pricing
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-5"
          >
            One flat fee.<br />
            <span className="gradient-text">Zero commissions.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto mb-8"
          >
            Pay a small monthly rate and keep every dollar your customers spend. 
            No hidden fees, no per-order cuts, no surprises.
          </motion.p>

          {/* Hero Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {['No lock-in contracts', 'We do all the setup', 'Built for Australian restaurants'].map((pill) => (
              <span key={pill} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-white/80">
                <span className="w-2 h-2 rounded-full bg-dine-orange" />
                {pill}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Setup Fee Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35 }}
          className="glass border border-white/10 rounded-2xl p-6 md:p-8 mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dine-orange to-dine-coral flex items-center justify-center flex-shrink-0">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-display font-bold text-lg">One-Time Setup Fee — AUD 249</p>
                <p className="text-white/50 text-sm">We handle everything. You approve it. You go live.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="text-white/70 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" /> Full site build & design
              </span>
              <span className="text-white/70 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" /> Menu import & setup
              </span>
              <span className="text-white/70 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" /> Domain connection
              </span>
              <span className="text-white/70 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" /> Launch & go-live
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-display font-bold text-white">AUD 249</div>
              <div className="text-sm text-white/40">Paid once at start</div>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className={`relative rounded-2xl ${
                plan.popular
                  ? 'glass border-2 border-dine-orange/50 glow-orange'
                  : 'glass border border-white/10'
              } p-6 md:p-8 flex flex-col`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white text-xs font-semibold shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-4">
                <p className="text-white/40 text-sm font-medium uppercase tracking-wide mb-1">{plan.name}</p>
                <h3 className="text-2xl font-display font-bold text-white">{plan.title}</h3>
                <p className="text-white/50 text-sm mt-2 leading-relaxed">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-4 pb-4 border-b border-white/10">
                <div className="flex items-baseline gap-1">
                  <span className="text-white/50 text-sm">AUD</span>
                  <span className="text-5xl font-display font-bold text-white">{plan.price}</span>
                  <span className="text-white/50">{plan.period}</span>
                </div>
                <p className="text-dine-orange text-sm mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {plan.save}
                </p>
              </div>

              {/* CTA */}
              <Link
                href="/contact"
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all mb-6 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-dine-orange to-dine-coral text-white btn-shine'
                    : 'glass text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Features Label */}
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">
                {plan.id === 'essential' ? "What's included" : `Everything in ${plan.id === 'growth' ? 'Essential' : 'Growth'}, plus`}
              </p>

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-dine-orange' : 'text-white/50'}`} />
                    <span className="text-sm text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Trust Note */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="text-center text-sm text-white/40 mb-20"
        >
          All plans include the one-time AUD 249 setup fee. Monthly billing starts after launch. Cancel anytime — no lock-in contracts.
        </motion.p>

        {/* ROI Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mb-20"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">Every plan pays for itself.</h2>
            <p className="text-white/50">Here's the simple maths for each tier — before you even think about the revenue upside.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {roiCards.map((card, i) => (
              <div key={i} className="glass border border-white/10 rounded-xl p-6">
                <p className="text-white/40 text-sm font-medium mb-2">{card.plan}</p>
                <p className="text-white font-semibold mb-3 leading-snug">&ldquo;{card.claim}&rdquo;</p>
                <p className="text-white/50 text-sm leading-relaxed">{card.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9 }}
          className="mb-20"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">Compare plans</h2>
            <p className="text-white/50">Everything side by side so you can pick the right fit.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 pr-4 text-white/50 font-medium text-sm">Feature</th>
                  <th className="text-center py-4 px-2 text-white/50 font-medium text-sm">
                    Essential<br /><span className="text-white font-bold">$79</span>
                  </th>
                  <th className="text-center py-4 px-2 text-white font-medium text-sm bg-dine-orange/10 rounded-t-lg">
                    Growth<br /><span className="text-white font-bold">$149</span>
                  </th>
                  <th className="text-center py-4 px-2 text-white/50 font-medium text-sm">
                    Pro<br /><span className="text-white font-bold">$249</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareFeatures.map((feature, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-white/70 text-sm">{feature.name}</td>
                    <td className="py-3 px-2 text-center">
                      {typeof feature.essential === 'boolean' ? (
                        feature.essential ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-white/20">—</span>
                        )
                      ) : (
                        <span className="text-white/50 text-sm">{feature.essential}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center bg-dine-orange/5">
                      {typeof feature.growth === 'boolean' ? (
                        feature.growth ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-white/20">—</span>
                        )
                      ) : (
                        <span className="text-white text-sm">{feature.growth}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-white/20">—</span>
                        )
                      ) : (
                        <span className="text-white/50 text-sm">{feature.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.0 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">Common questions</h2>
            <p className="text-white/50">Everything you need to know before getting started.</p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, i) => (
              <div key={i} className="glass border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-white font-medium pr-4">{faq.q}</span>
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    {openFaq === i ? (
                      <Minus className="w-4 h-4 text-white/60" />
                    ) : (
                      <Plus className="w-4 h-4 text-white/60" />
                    )}
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-white/60 text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
