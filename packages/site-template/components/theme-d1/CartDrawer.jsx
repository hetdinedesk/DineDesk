import React from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, MapPin, Clock } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatTableDisplay } from '../../lib/tableDetection';

export default function CartDrawer() {
  const router = useRouter()
  
  const {
    items, isOpen, closeCart, totalItems,
    subtotal, taxAmount, taxRate, taxLabel, total,
    updateQuantity, removeItem, ordering,
    tableInfo, isTableOrdering, orderType, paymentPreference
  } = useCart();

  const handleCheckout = () => {
    closeCart()
    const envSiteId = process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || ''
    const isProd = !!envSiteId
    const siteId = isProd ? '' : (router.query.site || '')
    
    // Add table information to checkout URL if available
    let checkoutUrl = isProd ? '/checkout' : `/checkout?site=${siteId}`
    if (isTableOrdering && tableInfo) {
      checkoutUrl += `&tableId=${tableInfo.tableId}&tableNumber=${encodeURIComponent(tableInfo.tableNumber)}&orderType=${orderType}&paymentPreference=${paymentPreference}`
    }
    
    // Only navigate if not already on checkout page
    if (router.pathname !== '/checkout') {
      router.push(checkoutUrl)
    }
  }

  const getOrderTypeDisplay = () => {
    if (isTableOrdering) {
      return 'Dine-in'
    }
    return 'Pick-up'
  }

  const getPaymentPreferenceDisplay = () => {
    if (isTableOrdering && paymentPreference === 'pay_at_table') {
      return 'Pay at Table'
    }
    return 'Pay Online'
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
            className="fixed inset-0 bg-black/50 z-[9998]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white border-l border-gray-200 z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-[var(--color-primary)]" />
                <div>
                  <h2 className="text-2xl font-semibold">Your Cart</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{getOrderTypeDisplay()}</span>
                    {isTableOrdering && <span>•</span>}
                    {isTableOrdering && <span>{getPaymentPreferenceDisplay()}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table Information */}
            {isTableOrdering && tableInfo && (
              <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className="font-medium text-amber-900">
                      {formatTableDisplay(tableInfo)}
                    </div>
                    <div className="text-sm text-amber-700">
                      Ordering from your table
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                  <ShoppingCart className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm mt-2">Add items from the menu to get started</p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {items.map((item) => (
                    <div key={item._cartKey || item.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                      {/* Item Image */}
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h4>
                          <span className="text-sm font-bold text-gray-900 flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.selectedSize && <p className="text-xs text-gray-500 mt-0.5">{item.selectedSize.name}{item.selectedSize.priceAdjustment > 0 ? ` +$${item.selectedSize.priceAdjustment.toFixed(2)}` : ''}</p>}
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <p className="text-xs text-gray-500">{item.selectedAddons.map(a => `${a.name}${a.price > 0 ? ` +$${a.price.toFixed(2)}` : ''}`).join(' · ')}</p>
                        )}
                        {item.specialInstructions && <p className="text-xs text-gray-400 italic mt-0.5">{item.specialInstructions}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item._cartKey || item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._cartKey || item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                          <button onClick={() => removeItem(item._cartKey || item.id)} className="ml-auto p-1 hover:bg-red-50 text-red-400 hover:text-red-500 rounded transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-6 space-y-4">
                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{taxLabel} ({taxRate}%)</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-[var(--color-primary)] text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  {isTableOrdering ? 'Place Order' : 'Proceed to Checkout'}
                </button>

                {/* Additional Info */}
                {isTableOrdering && (
                  <div className="text-xs text-gray-500 text-center">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Orders will be delivered to your table
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}