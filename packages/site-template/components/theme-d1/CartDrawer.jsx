import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, MapPin, Clock, UtensilsCrossed } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatTableDisplay } from '../../lib/tableDetection';
import { API_BASE } from '../../lib/tables';

export default function CartDrawer() {
  const router = useRouter()
  const [availableTables, setAvailableTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [showTableSelector, setShowTableSelector] = useState(false)
  
  const {
    items, isOpen, closeCart, totalItems,
    subtotal, taxAmount, taxRate, taxLabel, total,
    updateQuantity, removeItem, ordering,
    tableInfo, isTableOrdering, orderType, paymentPreference
  } = useCart();

  // Fetch available tables when in dine-in mode
  useEffect(() => {
    if (isTableOrdering && tableInfo?.locationId) {
      const fetchTables = async () => {
        try {
          const response = await fetch(`${API_BASE}/locations/${tableInfo.locationId}/tables`)
          const data = await response.json()
          setAvailableTables(data)
        } catch (error) {
          console.error('Failed to fetch tables:', error)
        }
      }
      fetchTables()
    }
  }, [isTableOrdering, tableInfo?.locationId])

  const handleCheckout = () => {
    closeCart()
    const envSiteId = process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || ''
    const isProd = !!envSiteId
    const siteId = isProd ? '' : (router.query.site || '')
    
    // Add table information to checkout URL if available
    let checkoutUrl = isProd ? '/checkout' : `/checkout?site=${siteId}`
    if (isTableOrdering && tableInfo) {
      checkoutUrl += `&tableId=${tableInfo.tableId}&orderType=${orderType}&paymentPreference=${paymentPreference}`
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

            {/* Table Selector for Dine-In */}
            {isTableOrdering && (
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">Select Your Table</h3>
                  <button
                    onClick={() => setShowTableSelector(!showTableSelector)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {showTableSelector ? 'Cancel' : 'Change Table'}
                  </button>
                </div>
                {showTableSelector && (
                  <div className="grid grid-cols-1 gap-3">
                    {availableTables.map(table => (
                      <div
                        key={table.id}
                        onClick={() => {
                          setSelectedTable(table)
                          updateTableInfo(table)
                          setShowTableSelector(false)
                        }}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTable?.id === table.id
                            ? 'bg-blue-100 border-blue-500 text-blue-900'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">Table {table.tableNumber}</div>
                            <div className="text-sm text-gray-500">{table.capacity} seats</div>
                          </div>
                          {table.isActive ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Available
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    <div key={item._cartKey || item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      {/* Item Image */}
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      
                      {/* Item Details */}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {item.selectedSize && <p className="text-xs text-gray-500">{item.selectedSize.name}</p>}
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <p className="text-xs text-gray-500">{item.selectedAddons.map(a => a.name).join(', ')}</p>
                        )}
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item._cartKey || item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._cartKey || item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item._cartKey || item.id)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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