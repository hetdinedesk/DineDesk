'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { QrCode, Smartphone, Utensils, CreditCard, Check, Clock, Sparkles } from 'lucide-react'

export function QrOrdering() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-20" />
      
      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 bg-dine-orange/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div ref={ref}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Sparkles className="w-4 h-4 text-dine-orange" />
              <span className="text-sm text-white/80">No App Required</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
            >
              QR Table Ordering{' '}
              <span className="gradient-text">Made Simple</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/60 mb-8"
            >
              Customers scan a QR code at their table, browse your digital menu, 
              place orders, and pay — all from their phone. No app download needed.
            </motion.p>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {[
                { icon: Clock, text: 'Reduce wait times by 60%' },
                { icon: CreditCard, text: 'Increase average order value by 25%' },
                { icon: Check, text: 'Automatic order routing to kitchen' },
                { icon: Utensils, text: 'No additional hardware needed' },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-dine-orange/20 flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-dine-orange" />
                  </div>
                  <span className="text-white/80">{benefit.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Content - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            {/* Phone Frame */}
            <div className="relative mx-auto w-72">
              <div className="glass rounded-[3rem] p-3 glow-orange">
                <div className="bg-dine-dark rounded-[2.5rem] overflow-hidden">
                  {/* Phone Header */}
                  <div className="h-6 bg-dine-dark flex items-center justify-center">
                    <div className="w-20 h-4 bg-black rounded-full" />
                  </div>
                  
                  {/* Phone Screen Content */}
                  <div className="p-4 space-y-4">
                    {/* Restaurant Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dine-orange to-dine-coral" />
                      <div>
                        <p className="text-sm font-medium text-white">Bella Vista</p>
                        <p className="text-xs text-white/50">Table 5</p>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 glass rounded-lg">
                        <div className="w-12 h-12 rounded-lg bg-amber-900/30 flex items-center justify-center text-lg">
                          🍕
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">Margherita Pizza</p>
                          <p className="text-xs text-dine-orange">$18.00</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white">-</button>
                          <span className="text-white text-sm">1</span>
                          <button className="w-6 h-6 rounded-full bg-dine-orange flex items-center justify-center text-white">+</button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 glass rounded-lg">
                        <div className="w-12 h-12 rounded-lg bg-green-900/30 flex items-center justify-center text-lg">
                          🥗
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">Caesar Salad</p>
                          <p className="text-xs text-dine-orange">$14.00</p>
                        </div>
                        <button className="px-3 py-1 rounded-full bg-dine-orange text-white text-xs">Add</button>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 glass rounded-lg">
                        <div className="w-12 h-12 rounded-lg bg-yellow-900/30 flex items-center justify-center text-lg">
                          🍝
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">Pasta Carbonara</p>
                          <p className="text-xs text-dine-orange">$22.00</p>
                        </div>
                        <button className="px-3 py-1 rounded-full bg-dine-orange text-white text-xs">Add</button>
                      </div>
                    </div>
                    
                    {/* Total & Checkout */}
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex justify-between mb-3">
                        <span className="text-white/60 text-sm">Total</span>
                        <span className="text-white font-bold">$18.00</span>
                      </div>
                      <button className="w-full py-3 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-medium text-sm">
                        Checkout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating QR Code */}
              <motion.div
                className="absolute -top-8 -right-8 w-24"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="glass rounded-xl p-3">
                  <div className="bg-white rounded-lg p-2">
                    <div className="grid grid-cols-5 gap-0.5">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-full aspect-square rounded-sm ${
                            [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24,6,12,18].includes(i) ? 'bg-dine-dark' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-center text-xs text-white/70 mt-1">Scan to Order</p>
                </div>
              </motion.div>
              
              {/* Floating Notification */}
              <motion.div
                className="absolute -bottom-4 -left-4 glass rounded-xl p-3"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-white font-medium">Order Received!</p>
                    <p className="text-xs text-white/50">Table 5 • $18.00</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
