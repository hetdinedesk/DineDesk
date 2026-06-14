'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { BarChart3, TrendingUp, Users, DollarSign, Eye, ShoppingBag, Sparkles } from 'lucide-react'

const metrics = [
  { icon: Eye, label: 'Page Views', value: '45.2K', change: '+18%', color: 'text-blue-400' },
  { icon: Users, label: 'Unique Visitors', value: '12.8K', change: '+24%', color: 'text-green-400' },
  { icon: ShoppingBag, label: 'Orders', value: '1,847', change: '+32%', color: 'text-dine-orange' },
  { icon: DollarSign, label: 'Revenue', value: '$89.4K', change: '+28%', color: 'text-purple-400' },
]

export function AnalyticsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy/50 to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content - Analytics Dashboard Mockup */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className="glass rounded-2xl p-2 glow-orange">
              <div className="bg-dine-dark rounded-xl overflow-hidden p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dine-orange to-dine-coral flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-white">Analytics</h3>
                      <p className="text-xs text-white/50">Last 30 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">+28% growth</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {metrics.map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="glass rounded-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <metric.icon className={`w-4 h-4 ${metric.color}`} />
                        <span className="text-xs text-white/50">{metric.label}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-xl font-bold text-white">{metric.value}</span>
                        <span className="text-xs text-green-400">{metric.change}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Chart Mockup */}
                <div className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-white/70">Revenue Trend</span>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-dine-orange/20 text-dine-orange">Week</span>
                      <span className="text-xs px-2 py-1 rounded bg-white/5 text-white/50">Month</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-32">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, index) => (
                      <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={isInView ? { height: `${height}%` } : {}}
                        transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                        className="flex-1 bg-gradient-to-t from-dine-orange to-dine-coral rounded-t"
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-white/30">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Sparkles className="w-4 h-4 text-dine-orange" />
              <span className="text-sm text-white/80">Data-Driven Insights</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
            >
              Understand Your{' '}
              <span className="gradient-text">Customers</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/60 mb-8"
            >
              Built-in analytics and Google Analytics 4 integration give you deep insights into 
              customer behavior, popular items, peak hours, and revenue trends. Make data-driven 
              decisions to grow your business.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="grid sm:grid-cols-2 gap-4"
            >
              {[
                'Google Analytics 4 integration',
                'Top items & categories report',
                'Peak hours analysis',
                'Customer behavior insights',
                'Revenue & order tracking',
                'Real-time dashboard updates',
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-dine-orange/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-dine-orange" />
                  </div>
                  <span className="text-white/80 text-sm">{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
