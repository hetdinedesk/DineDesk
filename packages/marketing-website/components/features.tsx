'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  Globe, ShoppingCart, Calendar, QrCode, Gift, MapPin,
  LayoutDashboard, CreditCard, Bell, BarChart3, Users, Zap,
  X, ChevronRight, Check, Star, Clock, Phone, Utensils,
  Package, ChefHat, CheckCircle, Tag, Image, PanelBottom,
  Settings, TrendingUp, DollarSign, ArrowRight
} from 'lucide-react'

// ── Real UI mockups for each feature ──────────────────────────

function MockWebsite() {
  return (
    <div className="bg-stone-900 rounded-xl overflow-hidden text-xs">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/40">
        <div className="w-2 h-2 rounded-full bg-red-400/70" />
        <div className="w-2 h-2 rounded-full bg-yellow-400/70" />
        <div className="w-2 h-2 rounded-full bg-green-400/70" />
        <span className="ml-2 text-white/30">bellavista.com.au</span>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <span className="font-bold text-white text-sm">Bella Vista</span>
        <div className="flex gap-3 text-white/50">
          <span>Menu</span><span>Bookings</span><span>About</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-amber-600 text-white text-xs">Order Now</div>
      </div>
      <div className="px-4 py-5">
        <div className="w-full h-20 rounded-lg bg-gradient-to-r from-amber-900/60 to-stone-800/60 mb-3 flex items-center justify-center">
          <div className="text-center">
            <p className="text-amber-400 font-bold text-sm">Italian Fine Dining</p>
            <p className="text-white/60 text-xs mt-0.5">Est. 2018 · Sydney CBD</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['Bruschetta $14', 'Risotto $28', 'Tiramisu $12'].map(item => (
            <div key={item} className="bg-white/5 rounded p-2 text-center">
              <div className="w-full h-8 rounded bg-amber-900/30 mb-1" />
              <p className="text-white/70 text-xs">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockOnlineOrdering() {
  const [step, setStep] = useState(0)
  const steps = ['Browse Menu', 'Add to Cart', 'Checkout', 'Confirmed']
  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs">
      <div className="flex gap-0 border-b border-white/10">
        {steps.map((s, i) => (
          <button key={s} onClick={() => setStep(i)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${i === step ? 'text-orange-400 border-b-2 border-orange-400' : 'text-white/30'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="p-4">
        {step === 0 && (
          <div className="space-y-2">
            {[
              { name: 'Margherita Pizza', price: '$22.00', desc: 'Tomato, mozzarella, basil' },
              { name: 'Garlic Bread', price: '$8.00', desc: 'House-made sourdough' },
              { name: 'Tiramisu', price: '$12.00', desc: 'Classic Italian dessert' },
            ].map(item => (
              <div key={item.name} className="flex items-center justify-between bg-white/5 rounded-lg p-2.5">
                <div>
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-white/40">{item.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 font-bold">{item.price}</span>
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">+</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {step === 1 && (
          <div>
            <p className="text-white/50 mb-2">Cart (2 items)</p>
            {[{ name: 'Margherita Pizza', price: '$22.00', qty: 1 }, { name: 'Garlic Bread', price: '$8.00', qty: 2 }].map(i => (
              <div key={i.name} className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white">{i.qty}× {i.name}</span>
                <span className="text-orange-400">{i.price}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-bold text-white mt-1">
              <span>Total</span><span className="text-orange-400">$38.00</span>
            </div>
            <div className="mt-3 flex gap-2">
              {['Pickup', 'Delivery', 'Dine-In'].map(t => (
                <div key={t} className="flex-1 text-center py-1.5 rounded bg-white/10 text-white/60 text-xs">{t}</div>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-2">
            <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder-white/30 text-xs" placeholder="Name" readOnly />
            <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder-white/30 text-xs" placeholder="Email" readOnly />
            <div className="bg-white/5 border border-white/10 rounded p-3 text-white/50 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-400" />
              •••• •••• •••• 4242
            </div>
            <div className="bg-orange-500 rounded-lg py-2 text-center text-white font-semibold">Pay $38.00</div>
          </div>
        )}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-bold mb-1">Order Confirmed!</p>
            <p className="text-white/50">Order #2341 · Est. 25 mins</p>
            <div className="mt-3 flex justify-center gap-1">
              {['Accepted', 'Preparing', 'Ready'].map((s, i) => (
                <div key={s} className={`px-2 py-1 rounded text-xs ${i === 1 ? 'bg-orange-500/30 text-orange-400' : 'bg-white/5 text-white/30'}`}>{s}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MockQrOrdering() {
  return (
    <div className="flex gap-4 items-start">
      {/* QR code side */}
      <div className="glass rounded-xl p-3 text-center flex-shrink-0">
        <div className="w-20 h-20 bg-white rounded p-1.5 mx-auto mb-2">
          <div className="grid grid-cols-5 gap-0.5 w-full h-full">
            {[1,1,1,1,1,1,0,0,0,1,1,0,1,0,1,1,0,0,0,1,1,1,1,1,1].map((f, i) => (
              <div key={i} className={`rounded-sm ${f ? 'bg-gray-900' : 'bg-transparent'}`} />
            ))}
          </div>
        </div>
        <p className="text-white/60 text-xs">Table 5</p>
        <p className="text-white/30 text-xs">Scan to order</p>
      </div>
      {/* Phone side */}
      <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs flex-1 border border-white/10">
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-3 py-2">
          <p className="text-orange-400 font-semibold">Bella Vista — Table 5</p>
          <p className="text-white/40 text-xs">Tap any item to add to your order</p>
        </div>
        <div className="p-3 space-y-2">
          {[
            { name: 'Caesar Salad', price: '$16', badge: null },
            { name: 'Pasta Carbonara', price: '$24', badge: 'Popular' },
            { name: 'Chicken Parma', price: '$26', badge: null },
          ].map(item => (
            <div key={item.name} className="flex justify-between items-center py-1.5 border-b border-white/5">
              <div>
                <span className="text-white">{item.name}</span>
                {item.badge && <span className="ml-2 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">{item.badge}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">{item.price}</span>
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">+</div>
              </div>
            </div>
          ))}
          <div className="mt-2 bg-orange-500 rounded-lg py-2 text-center text-white font-semibold">
            View Cart (1) · $24.00
          </div>
        </div>
      </div>
    </div>
  )
}

function MockBookings() {
  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs border border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-white font-semibold">Reservations — Today</p>
        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">5 booked</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { time: '6:00 PM', name: 'Johnson Family', guests: 4, table: 3, status: 'confirmed' },
          { time: '7:00 PM', name: 'Sarah & Mike', guests: 2, table: 1, status: 'confirmed' },
          { time: '7:30 PM', name: 'Corporate Dinner', guests: 8, table: 5, status: 'pending' },
          { time: '8:00 PM', name: 'Wang Party', guests: 6, table: 4, status: 'confirmed' },
        ].map(b => (
          <div key={b.name} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
            <div className="w-16 text-right flex-shrink-0">
              <span className="text-orange-400 font-medium">{b.time}</span>
            </div>
            <div className="flex-1">
              <p className="text-white">{b.name}</p>
              <p className="text-white/40">{b.guests} guests · Table {b.table}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs ${b.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {b.status}
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-white/10 bg-white/2">
        <p className="text-white/40 text-xs">Auto-assigns tables by party size · Confirmation emails sent</p>
      </div>
    </div>
  )
}

function MockLoyalty() {
  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs border border-white/10">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-white font-semibold">Loyalty Program</p>
        <span className="text-purple-400 text-xs">1,247 enrolled</span>
      </div>
      {/* Customer lookup */}
      <div className="p-3 border-b border-white/10">
        <p className="text-white/40 mb-2">Customer Lookup</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white/40 flex items-center gap-1">
            <Phone className="w-3 h-3" /> 04XX XXX XXX
          </div>
          <div className="px-3 py-2 bg-purple-500 rounded text-white">Look up</div>
        </div>
      </div>
      {/* Top customers */}
      <div className="p-3 space-y-2">
        {[
          { name: 'Emily Chen', points: 2840, visits: 24, reward: 'Free Coffee' },
          { name: 'David Martinez', points: 1920, visits: 18, reward: null },
          { name: 'Lisa Wong', points: 650, visits: 8, reward: null },
        ].map(c => (
          <div key={c.name} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/40 to-pink-500/40 flex items-center justify-center text-white font-bold flex-shrink-0">
              {c.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-white">{c.name}</p>
              <p className="text-white/40">{c.visits} visits</p>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-bold">{c.points} pts</p>
              {c.reward && <p className="text-purple-400 text-xs">{c.reward} 🎁</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockOperations() {
  const [orders, setOrders] = useState([
    { id: '#2341', items: 'Pasta Carbonara × 2', status: 'new', time: '2m ago', total: '$48' },
    { id: '#2340', items: 'Margherita Pizza × 1', status: 'preparing', time: '12m ago', total: '$22' },
    { id: '#2339', items: 'Caesar Salad × 3', status: 'ready', time: '20m ago', total: '$48' },
  ])

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    accepted: 'bg-yellow-500/20 text-yellow-400',
    preparing: 'bg-orange-500/20 text-orange-400',
    ready: 'bg-green-500/20 text-green-400',
    completed: 'bg-white/10 text-white/40',
  }

  const nextStatus: Record<string, string> = { new: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'completed' }

  const advance = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id && nextStatus[o.status] ? { ...o, status: nextStatus[o.status] } : o))
  }

  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs border border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-white font-semibold">Live Orders</p>
        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{orders.filter(o => o.status !== 'completed').length} Active</span>
      </div>
      <div className="p-3 space-y-2">
        {orders.map(o => (
          <div key={o.id} className="bg-white/5 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-semibold">{o.id}</p>
                <p className="text-white/50">{o.items}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-400 font-bold">{o.total}</p>
                <p className="text-white/30">{o.time}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status]}`}>
                {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
              </span>
              {nextStatus[o.status] && (
                <button onClick={() => advance(o.id)}
                  className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 rounded-full text-xs transition-colors">
                  → {nextStatus[o.status].charAt(0).toUpperCase() + nextStatus[o.status].slice(1)}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-white/10">
        <p className="text-white/30 text-xs">Click → to advance order status in real-time</p>
      </div>
    </div>
  )
}

function MockMenuManagement() {
  const [items] = useState([
    { name: 'Margherita Pizza', cat: 'Mains', price: '$22.00', available: true },
    { name: 'Caesar Salad', cat: 'Starters', price: '$16.00', available: true },
    { name: 'Garlic Bread', cat: 'Starters', price: '$8.00', available: false },
    { name: 'Tiramisu', cat: 'Desserts', price: '$12.00', available: true },
  ])
  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs border border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-white font-semibold">Menu Items</p>
        <div className="px-3 py-1 bg-orange-500 text-white rounded">+ Add Item</div>
      </div>
      <div className="flex gap-2 px-4 py-2 border-b border-white/10">
        {['All', 'Starters', 'Mains', 'Desserts'].map(c => (
          <div key={c} className={`px-2.5 py-1 rounded-full text-xs cursor-pointer ${c === 'All' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/40'}`}>{c}</div>
        ))}
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left px-4 py-2 text-white/30 font-normal">Item</th>
            <th className="text-left px-4 py-2 text-white/30 font-normal">Category</th>
            <th className="text-left px-4 py-2 text-white/30 font-normal">Price</th>
            <th className="text-left px-4 py-2 text-white/30 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.name} className="border-b border-white/5">
              <td className="px-4 py-2.5 text-white">{item.name}</td>
              <td className="px-4 py-2.5 text-white/50">{item.cat}</td>
              <td className="px-4 py-2.5 text-orange-400">{item.price}</td>
              <td className="px-4 py-2.5">
                <span className={`px-2 py-0.5 rounded-full ${item.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {item.available ? 'Available' : 'Hidden'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2 border-t border-white/10">
        <p className="text-white/30 text-xs">Drag to reorder · supports sizes, add-ons & variants</p>
      </div>
    </div>
  )
}

function MockAnalytics() {
  const bars = [40, 65, 55, 80, 70, 95, 85]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs border border-white/10">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-white font-semibold">Analytics — This Week</p>
        <span className="text-green-400 text-xs">↑ +12% vs last week</span>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4">
        {[
          { label: 'Revenue', value: '$4,280', change: '+18%', color: 'text-orange-400' },
          { label: 'Orders', value: '184', change: '+9%', color: 'text-blue-400' },
          { label: 'Avg Order', value: '$23.26', change: '+8%', color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-lg p-2.5">
            <p className="text-white/40">{s.label}</p>
            <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
            <p className="text-green-400">{s.change}</p>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <p className="text-white/30 mb-2">Daily Revenue</p>
        <div className="flex items-end gap-1.5 h-16">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-sm bg-orange-500/70" style={{ height: `${h}%` }} />
              <span className="text-white/30">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-2 border-t border-white/10">
        <p className="text-white/30 text-xs">Powered by Google Analytics 4 · via your CMS dashboard</p>
      </div>
    </div>
  )
}

function MockPayments() {
  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs border border-white/10">
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-white font-semibold">Payment Settings</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-5 rounded bg-violet-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="text-white font-medium">Stripe</span>
            </div>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Connected</span>
          </div>
          <div className="flex gap-2 mt-2">
            {['Cards', 'Apple Pay', 'Google Pay'].map(m => (
              <span key={m} className="px-2 py-0.5 bg-white/5 text-white/50 rounded">{m}</span>
            ))}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-5 rounded bg-emerald-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">□</span>
              </div>
              <span className="text-white font-medium">Square POS</span>
            </div>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Active</span>
          </div>
          <p className="text-white/40">Sync online orders with in-store POS</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-white">Cash Payments</p>
            <p className="text-white/40">Accept cash on pickup / at table</p>
          </div>
          <div className="w-10 h-5 rounded-full bg-orange-500 flex items-end px-0.5 pb-0.5">
            <div className="w-4 h-4 rounded-full bg-white ml-auto" />
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/40 mb-1">Currency</p>
          <p className="text-white">AUD — Australian Dollar</p>
        </div>
      </div>
      <div className="px-4 py-2 border-t border-white/10">
        <p className="text-white/30 text-xs">Server-side price verification on every order · PCI compliant</p>
      </div>
    </div>
  )
}

function MockEmailNotifications() {
  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs border border-white/10">
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-white font-semibold">Email Notifications</p>
        <p className="text-white/40">Powered by SendGrid</p>
      </div>
      <div className="p-4 space-y-3">
        {[
          { type: 'Order Confirmation', to: 'Customer', trigger: 'On order placed', enabled: true },
          { type: 'Order Ready', to: 'Customer', trigger: 'Status → Ready', enabled: true },
          { type: 'New Order Alert', to: 'Restaurant', trigger: 'On order placed', enabled: true },
          { type: 'Booking Confirmation', to: 'Customer', trigger: 'On reservation made', enabled: true },
          { type: 'Booking Reminder', to: 'Customer', trigger: '2 hours before', enabled: false },
        ].map(n => (
          <div key={n.type} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div>
              <p className={`font-medium ${n.enabled ? 'text-white' : 'text-white/40'}`}>{n.type}</p>
              <p className="text-white/30">To: {n.to} · {n.trigger}</p>
            </div>
            <div className={`w-8 h-4 rounded-full ${n.enabled ? 'bg-green-500' : 'bg-white/10'} flex items-center px-0.5`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-all ${n.enabled ? 'ml-auto' : ''}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockStaffAccess() {
  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs border border-white/10">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-white font-semibold">Staff Access</p>
        <div className="px-2 py-1 bg-orange-500 text-white rounded">+ Add Staff</div>
      </div>
      <div className="p-4 space-y-2">
        {[
          { name: 'Marco (You)', role: 'SUPER_ADMIN', access: 'Full access', color: 'text-orange-400 bg-orange-500/20' },
          { name: 'Sophie Chen', role: 'MANAGER', access: 'Orders, Menu, CMS', color: 'text-blue-400 bg-blue-500/20' },
          { name: 'James Park', role: 'EDITOR', access: 'Menu items only', color: 'text-green-400 bg-green-500/20' },
        ].map(u => (
          <div key={u.name} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold flex-shrink-0">
              {u.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-white">{u.name}</p>
              <p className="text-white/40">{u.access}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.color}`}>{u.role}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-white/10">
        <p className="text-white/30 text-xs">Roles: SUPER_ADMIN · MANAGER · EDITOR · Per-site permissions</p>
      </div>
    </div>
  )
}

function MockDeployment() {
  const [phase, setPhase] = useState(0)
  const phases = ['Idle', 'Building…', 'Deployed ✓']
  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs border border-white/10">
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-white font-semibold">Netlify Deployment</p>
        <p className="text-white/40">bellavista.com.au</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          {phases.map((p, i) => (
            <div key={p} className={`flex-1 text-center py-1.5 rounded text-xs ${i === phase ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-white/30'}`}>{p}</div>
          ))}
        </div>
        {phase === 2 ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-green-400 font-semibold">Live at bellavista.com.au</p>
            <p className="text-white/40">SSL active · CDN cached · 99.9% uptime</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {['Site build started', 'Installing dependencies', 'Next.js build', 'Deploying to CDN', 'SSL provisioned'].map((s, i) => (
              <div key={s} className={`flex items-center gap-2 py-1 ${phase === 1 && i <= 2 ? 'text-white' : 'text-white/30'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${phase === 1 && i === 2 ? 'bg-orange-400 animate-pulse' : phase === 1 && i < 2 ? 'bg-green-400' : 'bg-white/20'}`} />
                {s}
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setPhase(p => (p + 1) % 3)}
          className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors">
          {phase === 0 ? 'Deploy Site' : phase === 1 ? 'Building…' : 'Redeploy'}
        </button>
      </div>
    </div>
  )
}

function MockMultiLocation() {
  return (
    <div className="bg-[#0f1117] rounded-xl overflow-hidden text-xs border border-white/10">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-white font-semibold">Locations</p>
        <span className="text-orange-400">3 active</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { name: 'Bella Vista — CBD', orders: 12, tables: 20, status: 'Open', ordering: true },
          { name: 'Bella Vista — Surry Hills', orders: 8, tables: 14, status: 'Open', ordering: true },
          { name: 'Bella Vista — Newtown', orders: 0, tables: 10, status: 'Closed', ordering: false },
        ].map(loc => (
          <div key={loc.name} className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-white font-medium">{loc.name}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs ${loc.status === 'Open' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{loc.status}</span>
            </div>
            <div className="flex gap-3 text-white/40">
              <span>🛒 {loc.orders} orders</span>
              <span>🪑 {loc.tables} tables</span>
              <span>Ordering: {loc.ordering ? '✅' : '❌'}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-white/10">
        <p className="text-white/30 text-xs">Each location has its own menu, hours, tables & staff</p>
      </div>
    </div>
  )
}

// ── Feature definitions ───────────────────────────────────────

const features = [
  {
    icon: Globe,
    title: 'Professional Website',
    description: 'Professionally designed themes for fine dining, cafés, food trucks and more. Mobile-responsive with real-time CMS content updates.',
    color: 'from-blue-500 to-cyan-500',
    detail: 'Your site is built using one of three production-ready themes (Signature, Casual, Modern). Every page — menu, specials, team, about, custom pages — is managed from the CMS. You preview changes before they go live.',
    demo: <MockWebsite />,
  },
  {
    icon: ShoppingCart,
    title: 'Online Ordering',
    description: 'Pickup, delivery and dine-in ordering with add-ons, variants, taxes and Stripe payment processing built in.',
    color: 'from-dine-orange to-dine-coral',
    detail: 'Customers browse your live menu, add items (with sizes, add-ons, variants), choose pickup/delivery/dine-in, pay securely via Stripe or cash, and get an email confirmation. Orders appear instantly in your Operations dashboard.',
    demo: <MockOnlineOrdering />,
  },
  {
    icon: QrCode,
    title: 'QR Table Ordering',
    description: 'Customers scan a table QR code, browse and order directly. No app download. Reduces wait times and staff touchpoints.',
    color: 'from-purple-500 to-pink-500',
    detail: 'Each table gets a unique QR code generated from your CMS. Customers scan, see your full menu with photos and prices, add items to cart and submit their order. It goes straight to your live operations view.',
    demo: <MockQrOrdering />,
  },
  {
    icon: Calendar,
    title: 'Reservations & Bookings',
    description: 'Accept table reservations 24/7. Auto-assigns tables by party size, checks real-time availability and sends confirmation emails.',
    color: 'from-green-500 to-emerald-500',
    detail: 'A booking widget on your site lets guests pick a date, time and party size. The system checks available tables, auto-assigns the right one and sends the guest a confirmation email via SendGrid. All bookings appear in your dashboard.',
    demo: <MockBookings />,
  },
  {
    icon: Gift,
    title: 'Loyalty Program',
    description: 'Points-based rewards system. Customers earn on every order and redeem for rewards. Phone-number lookup, full order history.',
    color: 'from-yellow-500 to-orange-500',
    detail: 'You configure how many points per dollar spent and what rewards are available. Staff look up customers by phone at the counter. The program tracks every visit and total spend. Customers see their balance and rewards on your site.',
    demo: <MockLoyalty />,
  },
  {
    icon: MapPin,
    title: 'Multi-Location',
    description: 'Manage unlimited locations from one CMS. Each location has its own menu, hours, tables, ordering toggle and staff.',
    color: 'from-red-500 to-rose-500',
    detail: 'Add as many locations as you need. Each has independent menus, trading hours, table layouts, ordering on/off control and location-specific staff access. A single login manages them all.',
    demo: <MockMultiLocation />,
  },
  {
    icon: LayoutDashboard,
    title: 'Operations Dashboard',
    description: 'Live order tracking with real status flow: New → Accepted → Preparing → Ready → Completed. Update from any device.',
    color: 'from-indigo-500 to-violet-500',
    detail: 'The Operations section of your CMS shows every incoming order in real-time. You tap to advance each order through the status pipeline. Customers see their order status update live on the tracking page of your site.',
    demo: <MockOperations />,
  },
  {
    icon: Utensils,
    title: 'Menu Management',
    description: 'Full menu CMS with categories, items, photos, prices, sizes, add-ons, variants and drag-to-reorder.',
    color: 'from-amber-500 to-orange-500',
    detail: 'Add and manage categories and items from the Items section of your CMS. Each item supports an image, description, price, multiple sizes, add-ons (e.g. extra cheese +$2), variants, availability toggle and featured flag. Drag rows to reorder.',
    demo: <MockMenuManagement />,
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Google Analytics 4 built in. Revenue, orders, average order value and daily trends visible directly in your CMS.',
    color: 'from-pink-500 to-rose-500',
    detail: 'Connect your GA4 property in the Config section of your CMS. The Dashboard section then shows visitors, pageviews, bounce rate and session duration alongside your revenue and order data for the week, month or year.',
    demo: <MockAnalytics />,
  },
  {
    icon: CreditCard,
    title: 'Payments & POS',
    description: 'Stripe for online payments. Square POS integration for in-store sync. Cash on pickup also supported. Secure, verified transactions.',
    color: 'from-teal-500 to-cyan-500',
    detail: 'Connect your Stripe account via OAuth or enter API keys directly. Square POS integration syncs online orders with your in-store system. All card charges are server-side verified — we re-calculate every order total before charging to prevent tampering.',
    demo: <MockPayments />,
  },
  {
    icon: Bell,
    title: 'Email Notifications',
    description: 'Automated order and booking emails via SendGrid — to customers and to your restaurant. Configure which triggers are active.',
    color: 'from-amber-500 to-yellow-500',
    detail: 'The Notifications section of your CMS lets you configure your SendGrid API key and email address. Automated emails fire for: order placed (customer), order ready (customer), new order (restaurant), booking confirmed (customer) and booking reminder.',
    demo: <MockEmailNotifications />,
  },
  {
    icon: Users,
    title: 'Staff Access Control',
    description: 'Three roles: SUPER_ADMIN, MANAGER, EDITOR. Control exactly which sections each staff member can access.',
    color: 'from-cyan-500 to-blue-500',
    detail: 'Invite staff from the CMS user management. SUPER_ADMIN has full access. MANAGER can access all sections for their site. EDITOR access is restricted — you choose which sections (menu, CMS, operations) they can see per site.',
    demo: <MockStaffAccess />,
  },
  {
    icon: Zap,
    title: 'Netlify Deployment',
    description: 'One-click deploy to Netlify with automatic SSL and CDN. Custom domain connection. Manage deploys from your CMS Config.',
    color: 'from-lime-500 to-green-500',
    detail: 'The Deploy section of your Config panel connects to Netlify. One click builds and deploys your site. Your custom domain is connected with automatic SSL provisioning. You can trigger redeployments anytime after making content changes.',
    demo: <MockDeployment />,
  },
]

// ── Component ────────────────────────────────────────────────

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [active, setActive] = useState<number | null>(null)

  const activeFeature = active !== null ? features[active] : null

  return (
    <section id="features" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <motion.div
        className="absolute top-1/2 left-0 w-96 h-96 bg-dine-orange/10 rounded-full blur-3xl"
        animate={{ x: [0, 100, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={ref} className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Zap className="w-4 h-4 text-dine-orange" />
            <span className="text-sm text-white/80">All-in-One Platform</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5"
          >
            Everything You Need to{' '}
            <span className="gradient-text">Run Your Restaurant</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Click any feature to see exactly how it works inside DineDesk.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {features.map((feature, index) => (
            <motion.button
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              onClick={() => setActive(index)}
              className="group relative text-left glass rounded-2xl p-5 transition-all duration-300 hover:bg-white/5 border border-transparent"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-display font-bold text-white mb-1.5">{feature.title}</h3>
              <p className="text-xs text-white/55 leading-relaxed">{feature.description}</p>
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </motion.button>
          ))}
        </div>

        {/* Modal Popup */}
        <AnimatePresence>
          {activeFeature && (
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50"
            >
              {/* Backdrop */}
              <div
                onClick={() => setActive(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="absolute inset-0 flex items-center justify-center p-4"
              >
                <div
                  onClick={e => e.stopPropagation()}
                  className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0e1521] shadow-2xl"
                >
                  <div className="grid lg:grid-cols-2 gap-0">
                    {/* Left — info */}
                    <div className="p-8 border-b lg:border-b-0 lg:border-r border-white/10">
                      <div className="flex items-start justify-between mb-5">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeFeature.color} flex items-center justify-center`}>
                          <activeFeature.icon className="w-7 h-7 text-white" />
                        </div>
                        <button
                          onClick={() => setActive(null)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white mb-3">{activeFeature.title}</h3>
                      <p className="text-white/60 leading-relaxed mb-6">{activeFeature.detail}</p>
                      <div className="space-y-2">
                        {activeFeature.description.split('. ').filter(Boolean).map((line, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-dine-orange flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-white/70">{line.replace(/\.$/, '')}</span>
                          </div>
                        ))}
                      </div>
                      <a href="/contact" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold text-sm btn-shine">
                        Get This Feature
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Right — demo */}
                    <div className="p-8 bg-black/20">
                      {activeFeature.demo}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold btn-shine"
          >
            Get All of This for Your Restaurant
            <Zap className="w-5 h-5" />
          </a>
          <p className="text-white/40 text-sm mt-4">Contact us — we handle the full setup.</p>
        </motion.div>
      </div>
    </section>
  )
}
