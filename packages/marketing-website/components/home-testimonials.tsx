'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Marco Ferretti',
    role: 'Owner',
    restaurant: 'Bella Vista Ristorante',
    type: 'Fine Dining · Sydney',
    quote: 'We went from a basic website with no online presence to taking online reservations and QR table orders every night. DineDesk handled everything — we just approved the final result.',
    stars: 5,
    initials: 'MF',
    accentColor: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Priya Nair',
    role: 'Founder',
    restaurant: 'Spice Route Kitchen',
    type: 'Casual Dining · Melbourne',
    quote: 'The loyalty program alone brought back customers we had not seen in months. The CMS is straightforward enough that my manager can update the menu without calling me.',
    stars: 5,
    initials: 'PN',
    accentColor: 'from-red-500 to-rose-600',
  },
  {
    name: 'James & Lisa Tran',
    role: 'Co-owners',
    restaurant: 'Pho Corner',
    type: 'Fast Casual · Brisbane',
    quote: 'QR ordering at the tables has cut our order errors to almost zero. Customers love it and our staff can focus on food rather than taking orders. We pay less than what our old website cost.',
    stars: 5,
    initials: 'JT',
    accentColor: 'from-green-500 to-emerald-600',
  },
  {
    name: 'Sophie Andersen',
    role: 'Manager',
    restaurant: 'Nordic Bakes',
    type: 'Café · Perth',
    quote: 'Setup took less than a week. They configured Stripe, set up our delivery zones and even loaded all 60 menu items. I just reviewed the site, asked for two small changes and we went live.',
    stars: 5,
    initials: 'SA',
    accentColor: 'from-blue-500 to-cyan-600',
  },
  {
    name: 'Carlos Mendoza',
    role: 'Owner',
    restaurant: 'Taco Libre',
    type: 'Food Truck Chain · 3 locations',
    quote: 'Managing three locations from one dashboard is a game changer. Each location has its own menu and hours but I can see all orders in one view. The analytics help me know what is actually selling.',
    stars: 5,
    initials: 'CM',
    accentColor: 'from-purple-500 to-violet-600',
  },
  {
    name: 'Aisha Okonkwo',
    role: 'Director',
    restaurant: 'The Terrace Group',
    type: 'Multi-venue · 5 locations',
    quote: 'We needed different staff to have access to different locations. The role-based permissions work exactly as expected. Our head office team has full access, venue managers see only their site.',
    stars: 5,
    initials: 'AO',
    accentColor: 'from-pink-500 to-rose-600',
  },
]

export function HomeTestimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <motion.div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-dine-purple/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={ref} className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-sm font-semibold text-dine-orange uppercase tracking-widest mb-4"
          >
            Restaurant Owners
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5"
          >
            Trusted by Restaurants{' '}
            <span className="gradient-text">Across Australia</span>
          </motion.h2>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="glass rounded-2xl p-6 card-hover flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-dine-orange text-dine-orange" />
                ))}
              </div>

              {/* Quote */}
              <div className="relative flex-1">
                <Quote className="w-6 h-6 text-dine-orange/30 absolute -top-1 -left-1" />
                <p className="text-white/70 text-sm leading-relaxed pl-5">{t.quote}</p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/10">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.accentColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm font-bold">{t.initials}</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/50 text-xs">{t.role} · {t.restaurant}</p>
                  <p className="text-white/30 text-xs">{t.type}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
