import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCMS } from '../../contexts/CMSContext';

const API_BASE = process.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3001/api'

function useAlsoOrderedWith(clientId, cartItemIds) {
  const [suggestions, setSuggestions] = useState([])
  const idsString = useMemo(() => cartItemIds.join(','), [cartItemIds])
  useEffect(() => {
    if (!clientId || cartItemIds.length === 0) { setSuggestions([]); return }
    fetch(`${API_BASE}/clients/${clientId}/menu-items/suggestions?itemIds=${idsString}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => setSuggestions([]))
  }, [clientId, idsString, cartItemIds.length])
  return suggestions
}

export default function CartDrawer() {
  const router = useRouter()
  const {
    items, isOpen, closeCart, totalItems,
    subtotal, taxAmount, taxRate, taxLabel, total,
    updateQuantity, removeItem, addItem, ordering,
    tableInfo, isTableOrdering, orderType, paymentPreference
  } = useCart();

  const { restaurant } = useCMS();
  const clientId = restaurant?.id || ''
  const cartItemIds = items.map(i => i.id).filter(Boolean)
  const suggestions = useAlsoOrderedWith(clientId, cartItemIds)
  const cartIdSet = new Set(items.map(i => i.id))
  const filteredSuggestions = suggestions.filter(s => !cartIdSet.has(s.id)).slice(0, 3)

  const handleCheckout = () => {
    closeCart()
    const envSiteId = process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || ''
    const isProd = !!envSiteId
    const siteId = isProd ? '' : (router.query.site || '')
    let checkoutUrl = isProd ? '/checkout' : `/checkout?site=${siteId}`
    if (isTableOrdering && tableInfo) {
      const sep = checkoutUrl.includes('?') ? '&' : '?'
      checkoutUrl += `${sep}tableId=${tableInfo.tableId}&tableNumber=${encodeURIComponent(tableInfo.tableNumber)}&locationId=${tableInfo.locationId || ''}&orderType=${orderType}&paymentPreference=${paymentPreference}`
    }
    if (router.pathname !== '/checkout') {
      router.push(checkoutUrl)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-[var(--color-secondary)]/50 backdrop-blur-sm z-[9998]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-[var(--color-accent)] border-l border-[var(--color-secondary)]/10 z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--color-secondary)]/10 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[var(--color-secondary)]">Your Order</h2>
                  <p className="text-sm text-[var(--color-secondary)]/60">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="w-10 h-10 rounded-full hover:bg-[var(--color-accent)] flex items-center justify-center transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-[var(--color-secondary)]" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-full bg-white border border-[var(--color-secondary)]/20 flex items-center justify-center mb-4">
                    <ShoppingCart className="w-8 h-8 text-[var(--color-secondary)]/30" />
                  </div>
                  <p className="text-[var(--color-secondary)] text-lg font-medium font-serif">Your cart is empty</p>
                  <p className="text-[var(--color-secondary)]/50 text-sm mt-1">Add items from the menu to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item._cartKey || item.id} className="bg-white border border-[var(--color-secondary)]/10 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex gap-4">
                        {/* Image */}
                        {item.image && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif font-bold text-[var(--color-secondary)] mb-1 truncate">{item.name}</h4>
                          {item.selectedSize && <p className="text-xs text-[var(--color-secondary)]/60">{item.selectedSize.name}{item.selectedSize.priceAdjustment > 0 ? ` +$${item.selectedSize.priceAdjustment.toFixed(2)}` : ''}</p>}
                          {item.selectedAddons && item.selectedAddons.length > 0 && <p className="text-xs text-[var(--color-secondary)]/60">{item.selectedAddons.map(a => `${a.name}${a.price > 0 ? ` +$${a.price.toFixed(2)}` : ''}`).join(' · ')}</p>}
                          {item.specialInstructions && <p className="text-xs text-[var(--color-secondary)]/40 italic">{item.specialInstructions}</p>}
                          <p className="text-sm text-[var(--color-primary)] font-bold">${item.price.toFixed(2)} each</p>

                          <div className="flex items-center gap-3 mt-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 rounded-xl overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item._cartKey || item.id, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-white transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-4 h-4 text-[var(--color-secondary)]" />
                              </button>
                              <span className="w-10 text-center font-bold text-[var(--color-secondary)]">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item._cartKey || item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-white transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-4 h-4 text-[var(--color-secondary)]" />
                              </button>
                            </div>

                            {/* Remove */}
                            <button
                              onClick={() => removeItem(item._cartKey || item.id)}
                              className="ml-auto w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-serif font-bold text-[var(--color-secondary)]">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Also Ordered With */}
            {items.length > 0 && filteredSuggestions.length > 0 && (
              <div className="px-6 py-4 border-t border-[var(--color-secondary)]/10 bg-amber-50/50">
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Customers also ordered</span>
                </div>
                <div className="flex flex-col gap-2">
                  {filteredSuggestions.map(s => (
                    <div key={s.id} className="flex items-center gap-3 bg-white rounded-2xl p-2.5 border border-amber-100">
                      {s.imageUrl
                        ? <img src={s.imageUrl} alt={s.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-serif font-bold text-[var(--color-secondary)] truncate">{s.name}</div>
                        <div className="text-xs text-[var(--color-primary)] font-bold">${parseFloat(s.price).toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => addItem({ id: s.id, name: s.name, price: parseFloat(s.price), imageUrl: s.imageUrl })}
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer - Order Summary */}
            {items.length > 0 && (
              <div className="border-t border-[var(--color-secondary)]/10 p-6 space-y-4 bg-white">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-secondary)]/60">Subtotal</span>
                    <span className="font-bold text-[var(--color-secondary)]">${subtotal.toFixed(2)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-secondary)]/60">{taxLabel} ({taxRate}%)</span>
                      <span className="font-bold text-[var(--color-secondary)]">${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="h-px bg-[var(--color-secondary)]/10 my-2" />
                  <div className="flex justify-between text-lg">
                    <span className="font-serif font-bold text-[var(--color-secondary)]">Total</span>
                    <span className="font-serif font-bold text-[var(--color-primary)]">${total.toFixed(2)}</span>
                  </div>
                </div>

                {ordering?.estimatedPrepTime && (
                  <p className="text-xs text-[var(--color-secondary)]/40 text-center">
                    Estimated prep time: {ordering.estimatedPrepTime}
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-[var(--color-secondary)] transition-all duration-300 shadow-lg flex items-center justify-center gap-2 group"
                  style={{ background: 'var(--color-primary)' }}
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
