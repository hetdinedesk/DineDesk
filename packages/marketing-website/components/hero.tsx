'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Zap, Shield } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-gradient" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      {/* Floating Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-dine-orange/20 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-dine-purple/20 rounded-full blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-64 h-64 bg-dine-coral/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Sparkles className="w-4 h-4 text-dine-orange" />
              <span className="text-sm text-white/80">The Complete Restaurant Platform</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight mb-6"
            >
              Run Your Restaurant{' '}
              <span className="gradient-text">Like a Pro</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-white/70 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Website builder, online ordering, reservations, QR table ordering, 
              loyalty programs, and real-time analytics — all connected in one powerful platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/contact"
                className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold overflow-hidden btn-shine flex items-center justify-center gap-2"
              >
                <span className="relative z-10">Get Started Today</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/how-it-works"
                className="group px-8 py-4 rounded-full glass text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                See How It Works
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-10"
            >
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Zap className="w-4 h-4 text-dine-orange" />
                <span>We do all the setup</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Shield className="w-4 h-4 text-dine-orange" />
                <span>SSL Secure</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Sparkles className="w-4 h-4 text-dine-orange" />
                <span>No long-term contracts</span>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Main Dashboard Card */}
            <div className="relative">
              <div className="glass rounded-2xl p-4 glow-orange float-animation">
                <div className="bg-dine-dark rounded-xl overflow-hidden">
                  {/* Dashboard Header */}
                  <div className="flex items-center gap-2 p-3 border-b border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-xs text-white/50">DineDesk Dashboard</span>
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="p-4 space-y-3">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="glass rounded-lg p-3">
                        <p className="text-xs text-white/50">Today's Orders</p>
                        <p className="text-xl font-bold text-white">47</p>
                        <p className="text-xs text-green-400">+12%</p>
                      </div>
                      <div className="glass rounded-lg p-3">
                        <p className="text-xs text-white/50">Revenue</p>
                        <p className="text-xl font-bold text-white">$2.4k</p>
                        <p className="text-xs text-green-400">+8%</p>
                      </div>
                      <div className="glass rounded-lg p-3">
                        <p className="text-xs text-white/50">Customers</p>
                        <p className="text-xl font-bold text-white">128</p>
                        <p className="text-xs text-green-400">+15%</p>
                      </div>
                    </div>
                    
                    {/* Order List */}
                    <div className="glass rounded-lg p-3 space-y-2">
                      <p className="text-xs text-white/50 mb-2">Live Orders</p>
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                          <span className="text-sm text-white">Order #2341</span>
                        </div>
                        <span className="text-xs text-white/50">Preparing</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-sm text-white">Order #2340</span>
                        </div>
                        <span className="text-xs text-white/50">Ready</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-sm text-white">Order #2339</span>
                        </div>
                        <span className="text-xs text-white/50">New</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Phone Mockup */}
              <motion.div
                className="absolute -bottom-10 -left-10 w-32"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="glass rounded-2xl p-2 glow-purple">
                  <div className="bg-dine-dark rounded-xl p-3">
                    <div className="space-y-2">
                      <div className="h-2 bg-white/10 rounded w-3/4" />
                      <div className="h-8 bg-dine-orange/20 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-dine-orange font-medium">New Order!</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating QR Card */}
              <motion.div
                className="absolute -top-5 -right-5 w-28"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="glass rounded-xl p-3">
                  <div className="bg-white rounded-lg p-2">
                    <div className="grid grid-cols-5 gap-0.5">
                      {[1,1,1,1,1, 1,0,0,0,1, 1,0,1,0,1, 1,0,0,0,1, 1,1,1,1,1].map((filled, i) => (
                        <div
                          key={i}
                          className={`w-full aspect-square rounded-sm ${filled ? 'bg-dine-dark' : 'bg-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-center text-xs text-white/70 mt-2">Table 5</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <motion.div
            className="w-1.5 h-3 rounded-full bg-dine-orange"
            animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}
