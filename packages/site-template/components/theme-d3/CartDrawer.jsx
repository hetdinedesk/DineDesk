import React from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export default function CartDrawer() {
  const router = useRouter()
  const {
    items, isOpen, closeCart, totalItems,
    subtotal, taxAmount, taxRate, taxLabel, total,
    updateQuantity, removeItem, ordering
  } = useCart();

  const handleCheckout = () => {
    closeCart()
    const siteId = router.query.site || process.env.SITE_ID || ''
    if (router.pathname !== '/checkout') {
      router.push(`/checkout?site=${siteId}`)
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
            className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-[var(--color-accent)] border-l border-[var(--color-secondary)]/10 z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-[var(--color-secondary)]/10 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center">
                  <ShoppingCart width={24} height={24} strokeWidth={2} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <h2 className="font-serif text-3xl italic text-[var(--color-secondary)]">Your Harvest</h2>
                  <p className="text-xs font-sans font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">
                    {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="w-12 h-12 rounded-full hover:bg-[var(--color-accent)] flex items-center justify-center transition-colors"
                aria-label="Close cart"
              >
                <X width={20} height={20} strokeWidth={2} className="text-[var(--color-secondary)]" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-8">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="w-24 h-24 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center">
                    <ShoppingCart width={32} height={32} strokeWidth={2} className="text-[var(--color-primary)]/40" />
                  </div>
                  <div>
                    <p className="font-serif text-2xl italic text-[var(--color-secondary)]">Your harvest is empty</p>
                    <p className="text-xs font-sans font-bold tracking-widest text-[var(--color-secondary)]/40 uppercase mt-2">ADD ITEMS FROM THE MENU</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map(item => (
                    <div key={item.id} className="bg-white border border-[var(--color-secondary)]/10 rounded-[32px] p-6 space-y-4 shadow-sm">
                      <div className="flex gap-6">
                        {/* Image */}
                        {item.image && (
                          <div className="w-24 h-24 rounded-[24px] overflow-hidden flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <h4 className="font-serif text-xl italic text-[var(--color-secondary)]">{item.name}</h4>
                          <p className="text-sm font-sans font-bold text-[var(--color-primary)]">${item.price.toFixed(2)}</p>

                          <div className="flex items-center gap-4 mt-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 rounded-full overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-10 h-10 flex items-center justify-center hover:bg-white transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus width={16} height={16} strokeWidth={2} className="text-[var(--color-secondary)]" />
                              </button>
                              <span className="w-12 text-center font-bold text-[var(--color-secondary)]">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center hover:bg-white transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus width={16} height={16} strokeWidth={2} className="text-[var(--color-secondary)]" />
                              </button>
                            </div>

                            {/* Remove */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="ml-auto w-10 h-10 rounded-full bg-[var(--color-secondary)]/5 text-[var(--color-secondary)]/40 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 width={16} height={16} strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-serif text-xl italic text-[var(--color-secondary)]">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Order Summary */}
            {items.length > 0 && (
              <div className="border-t border-[var(--color-secondary)]/10 p-8 space-y-6 bg-white">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-xs font-sans font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Subtotal</span>
                    <span className="font-sans font-bold text-[var(--color-secondary)]">${subtotal.toFixed(2)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs font-sans font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">{taxLabel} ({taxRate}%)</span>
                      <span className="font-sans font-bold text-[var(--color-secondary)]">${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="h-px bg-[var(--color-secondary)]/10 my-4" />
                  <div className="flex justify-between">
                    <span className="font-serif text-2xl italic text-[var(--color-secondary)]">Total</span>
                    <span className="font-serif text-2xl italic text-[var(--color-primary)]">${total.toFixed(2)}</span>
                  </div>
                </div>

                {ordering?.estimatedPrepTime && (
                  <p className="text-xs font-sans font-bold tracking-widest text-[var(--color-secondary)]/40 uppercase text-center">
                    Estimated prep time: {ordering.estimatedPrepTime}
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  className="w-full py-5 rounded-full text-[10px] font-bold tracking-widest uppercase text-[var(--color-accent)] transition-all duration-300 shadow-lg flex items-center justify-center gap-3 group bg-[var(--color-primary)] hover:bg-[var(--color-secondary)]"
                >
                  PROCEED TO CHECKOUT
                  <ArrowRight width={18} height={18} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
