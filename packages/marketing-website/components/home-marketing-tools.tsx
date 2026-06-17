'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  Tag,
  Gift,
  RefreshCw,
  ArrowRight,
  Check,
  ShoppingCart,
} from 'lucide-react'

const tabs = [
  { id: 'menu', label: 'Menu Images', icon: ImageIcon },
  { id: 'orders', label: 'Order Charts', icon: TrendingUp },
  { id: 'specials', label: 'Specials Banners', icon: Tag },
  { id: 'loyalty', label: 'Loyalty Program', icon: Gift },
]

function MenuImagesPreview() {
  const dishes = [
    {
      name: 'Truffle Linguine',
      price: '$28',
      tag: "Chef's Pick",
      tagColor: 'bg-amber-500',
      img: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80',
    },
    {
      name: 'Barramundi Fillet',
      price: '$34',
      tag: 'New',
      tagColor: 'bg-blue-400',
      img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80',
    },
    {
      name: 'Wagyu Burger',
      price: '$22',
      tag: 'Best Seller',
      tagColor: 'bg-orange-500',
      img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    },
    {
      name: 'Tiramisu',
      price: '$14',
      tag: 'Popular',
      tagColor: 'bg-rose-500',
      img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80',
    },
  ]
  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Auto-generated dish cards</p>
      <div className="grid grid-cols-2 gap-3">
        {dishes.map((dish) => (
          <div key={dish.name} className="rounded-xl overflow-hidden bg-white/5">
            <div className="h-24 relative overflow-hidden">
              <img
                src={dish.img}
                alt={dish.name}
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${dish.tagColor}`}>
                {dish.tag}
              </span>
            </div>
            <div className="px-3 pb-3 pt-2">
              <p className="text-white text-xs font-semibold leading-tight">{dish.name}</p>
              <p className="text-dine-orange text-xs font-bold mt-0.5">{dish.price}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-5 h-5 rounded-full bg-dine-orange/20 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-dine-orange" />
        </div>
        <p className="text-xs text-white/50">Cards generated from your menu data — updated automatically when you edit items</p>
      </div>
    </div>
  )
}

function OrderChartPreview() {
  const bars = [
    { day: 'Mon', orders: 18, revenue: 420 },
    { day: 'Tue', orders: 24, revenue: 610 },
    { day: 'Wed', orders: 31, revenue: 740 },
    { day: 'Thu', orders: 28, revenue: 680 },
    { day: 'Fri', orders: 47, revenue: 1140 },
    { day: 'Sat', orders: 62, revenue: 1580 },
    { day: 'Sun', orders: 53, revenue: 1280 },
  ]
  const maxOrders = 62
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Weekly orders</p>
        <span className="text-xs font-bold text-green-400 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> +18% this week
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {bars.map((b) => (
          <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-dine-orange to-dine-coral"
              style={{ height: `${(b.orders / maxOrders) * 88}px` }}
            />
            <span className="text-[9px] text-white/40">{b.day}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-1">
        {[
          { label: 'Total Orders', value: '263', sub: 'this week' },
          { label: 'Revenue', value: '$6,450', sub: 'this week' },
          { label: 'Avg Order', value: '$24.50', sub: 'per order' },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-white font-bold text-sm">{s.value}</p>
            <p className="text-white/40 text-[9px] leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SpecialsBannersPreview() {
  const banners = [
    {
      title: 'Happy Hour',
      sub: '3pm – 6pm Daily',
      detail: '30% off all drinks',
      color: 'from-amber-600 to-orange-700',
      badge: 'Today',
    },
    {
      title: 'Tuesday Pasta Night',
      sub: 'Every Tuesday',
      detail: 'Buy 1 get 1 free on all pastas',
      color: 'from-red-700 to-rose-800',
      badge: 'Weekly',
    },
    {
      title: 'Summer Seafood Platter',
      sub: 'Limited time offer',
      detail: 'For 2 people — $59 only',
      color: 'from-blue-700 to-cyan-800',
      badge: 'Seasonal',
    },
  ]
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Auto-generated promo banners</p>
      {banners.map((b) => (
        <div key={b.title} className={`bg-gradient-to-r ${b.color} rounded-xl px-4 py-3 flex items-center justify-between`}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-white font-bold text-sm">{b.title}</p>
              <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-semibold">{b.badge}</span>
            </div>
            <p className="text-white/70 text-xs">{b.sub}</p>
            <p className="text-white/90 text-xs font-semibold mt-0.5">{b.detail}</p>
          </div>
          <Tag className="w-6 h-6 text-white/40 flex-shrink-0" />
        </div>
      ))}
      <p className="text-xs text-white/40 flex items-center gap-1.5 mt-1">
        <RefreshCw className="w-3 h-3" /> Refreshed each month — or whenever you update your specials in CMS
      </p>
    </div>
  )
}

function LoyaltyBannersPreview() {
  const rewards = [
    { name: '$5 Off Your Order', points: 100, discount: '$5.00', type: 'fixed' },
    { name: '10% Off Order', points: 200, discount: '10%', type: 'percent' },
    { name: 'Free Coffee', points: 350, discount: '$7.00', type: 'fixed' },
  ]
  const customerPoints = 210

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Loyalty program — how it works</p>

      {/* Points earn rate config */}
      <div className="bg-gradient-to-br from-violet-800 to-purple-900 rounded-xl p-4 relative overflow-hidden">
        <div className="absolute right-3 top-3 w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
          <Gift className="w-6 h-6 text-purple-300" />
        </div>
        <p className="text-white/60 text-[10px] mb-1 font-semibold uppercase tracking-wide">Points rate</p>
        <h4 className="text-white font-bold text-base mb-0.5">1 point per $1 spent</h4>
        <p className="text-white/50 text-xs">Customers earn on every order · looked up by phone number</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="bg-white/10 rounded-full px-3 py-1 text-xs text-white font-semibold">
            {customerPoints} pts
          </div>
          <span className="text-white/40 text-xs">customer's current balance</span>
        </div>
      </div>

      {/* Rewards catalog */}
      <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Rewards catalog</p>
      <div className="space-y-2">
        {rewards.map((r) => {
          const canRedeem = customerPoints >= r.points
          return (
            <div key={r.name} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${canRedeem ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-transparent'}`}>
              <div>
                <p className={`text-xs font-semibold ${canRedeem ? 'text-white' : 'text-white/50'}`}>{r.name}</p>
                <p className="text-[10px] text-white/30">{r.points} pts required · {r.discount} off</p>
              </div>
              <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${canRedeem ? 'bg-dine-orange text-white' : 'bg-white/10 text-white/30'}`}>
                {canRedeem ? 'Redeem' : `${r.points - customerPoints} pts away`}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-white/40 flex items-center gap-1.5 mt-1">
        <Sparkles className="w-3 h-3 text-dine-orange" /> Rewards catalog configured in your CMS — points rate and rewards are fully customisable
      </p>
    </div>
  )
}

const tabContent: Record<string, React.ReactNode> = {
  menu: <MenuImagesPreview />,
  orders: <OrderChartPreview />,
  specials: <SpecialsBannersPreview />,
  loyalty: <LoyaltyBannersPreview />,
}

const benefits = [
  'Dish image cards generated from your menu — auto-refreshed when items change',
  'Weekly and monthly order charts always up to date, no setup required',
  'Specials and offer banners created from your promotions — refreshed every month',
  'Loyalty program with configurable points rate and rewards catalog — customers earn on every order and redeem at checkout',
  'Everything lives on your site — no third-party marketing tools needed',
  'We help you set up monthly promotions and seasonal offers through your CMS',
]

export function HomeMarketingTools() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeTab, setActiveTab] = useState('menu')

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <motion.div
        className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-dine-orange/8 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], x: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={ref} className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-sm font-semibold text-dine-orange uppercase tracking-widest mb-4"
          >
            Built-In Marketing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5"
          >
            Your Marketing,{' '}
            <span className="gradient-text">Generated For You</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Dish image cards, order charts, specials banners, monthly offer tiles and loyalty
            program banners — all generated automatically from your data and updated whenever
            you make a change in your CMS.
          </motion.p>
        </div>

        {/* Two-col layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left — tab preview */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            {/* Tab bar */}
            <div className="flex gap-2 flex-wrap mb-5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-dine-orange text-white'
                      : 'glass text-white/50 hover:text-white/80'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Preview card */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-5"
              style={{ boxShadow: '0 0 50px rgba(249,115,22,0.1)' }}
            >
              {tabContent[activeTab]}
            </motion.div>
          </motion.div>

          {/* Right — benefit list */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="glass rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-dine-orange/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-dine-orange" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">We help you every month</h3>
                  <p className="text-white/50 text-sm">Promotional content, not just a platform</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Most platforms give you tools and leave you to it. DineDesk helps you actually
                use them — we assist with setting up your monthly specials, updating promotional
                banners and keeping your loyalty offers fresh so customers keep coming back.
              </p>
            </div>

            <div className="space-y-2.5">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-dine-orange/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-dine-orange" />
                  </div>
                  <p className="text-sm text-white/65 leading-relaxed">{b}</p>
                </motion.div>
              ))}
            </div>

            {/* Quick stat pills */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
              {[
                { icon: ShoppingCart, label: 'Order charts auto-updated' },
                { icon: RefreshCw, label: 'Monthly offer refresh' },
                { icon: Gift, label: 'Loyalty banners live' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5">
                  <Icon className="w-3 h-3 text-dine-orange" />
                  <span className="text-xs text-white/50">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
