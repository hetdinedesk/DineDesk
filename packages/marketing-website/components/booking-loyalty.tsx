'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Calendar, Gift, Star, Clock, Users, ArrowRight, Check, Sparkles } from 'lucide-react'

export function BookingLoyalty() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Sparkles className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">Grow Your Business</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
          >
            Bookings & Loyalty{' '}
            <span className="gradient-text">Built In</span>
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Bookings Section */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white">Table Reservations</h3>
            </div>
            
            <p className="text-white/60 mb-6">
              Accept online reservations 24/7. Automatic table assignment, availability checking, 
              and confirmation emails — all handled automatically.
            </p>

            <div className="space-y-4 mb-8">
              {[
                'Online booking widget for your website',
                'Automatic table assignment by party size',
                'Availability checking in real-time',
                'Confirmation & reminder emails',
                'Booking management dashboard',
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-white/80 text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Booking Mockup */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white">Upcoming Reservations</span>
                <span className="text-xs text-green-400">3 Today</span>
              </div>
              <div className="space-y-2">
                {[
                  { time: '7:00 PM', name: 'Johnson Family', size: 4, table: 3 },
                  { time: '7:30 PM', name: 'Sarah & Mike', size: 2, table: 1 },
                  { time: '8:00 PM', name: 'Corporate Dinner', size: 8, table: 5 },
                ].map((booking, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white">{booking.name}</p>
                        <p className="text-xs text-white/50">{booking.size} guests • Table {booking.table}</p>
                      </div>
                    </div>
                    <span className="text-sm text-dine-orange">{booking.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Loyalty Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white">Loyalty Program</h3>
            </div>
            
            <p className="text-white/60 mb-6">
              Build customer loyalty with a points-based rewards program. Customers earn points 
              on every order and redeem them for rewards — all tracked automatically.
            </p>

            <div className="space-y-4 mb-8">
              {[
                'Points earned on every order',
                'Customizable reward catalog',
                'Customer order history tracking',
                'Personalized offers & promotions',
                'Phone-based customer lookup',
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <Check className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-white/80 text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Loyalty Mockup */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white">Top Customers</span>
                <div className="flex items-center gap-1 text-xs text-purple-400">
                  <Users className="w-3 h-3" />
                  1,247 enrolled
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Emily Chen', points: 2840, visits: 24 },
                  { name: 'David Martinez', points: 1920, visits: 18 },
                  { name: 'Lisa Wong', points: 1650, visits: 15 },
                ].map((customer, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{customer.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm text-white">{customer.name}</p>
                        <p className="text-xs text-white/50">{customer.visits} visits</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-dine-orange font-medium">{customer.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
