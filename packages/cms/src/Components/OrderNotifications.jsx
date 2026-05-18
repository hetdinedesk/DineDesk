import { useState, useEffect, useRef } from 'react'
import { Bell, X, ShoppingCart, Clock } from 'lucide-react'
import { useOrders } from '../contexts/OrderContext'
import { C } from '../theme'

export default function OrderNotifications({ clientId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [previousOrderIds, setPreviousOrderIds] = useState(new Set())
  const audioRef = useRef(null)
  
  // Use shared order data from OrderContext
  const { orders, getNewOrders } = useOrders()

  // Initialize audio for notification sound
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try Web Audio API first
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        
        // Store the play function with interesting sound
        audioRef.current = () => {
          // Create a more interesting notification sound
          const osc1 = audioContext.createOscillator()
          const osc2 = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          osc1.connect(gainNode)
          osc2.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          // Create a pleasant two-tone notification
          osc1.frequency.value = 523.25 // C5 note
          osc2.frequency.value = 659.25 // E5 note
          osc1.type = 'sine'
          osc2.type = 'sine'
          gainNode.gain.value = 0.15
          
          osc1.start()
          osc2.start(audioContext.currentTime + 0.1) // Start second note slightly delayed
          osc1.stop(audioContext.currentTime + 0.3)
          osc2.stop(audioContext.currentTime + 0.4)
        }
        
        console.log('Order notifications audio initialized')
      } catch (err) {
        console.log('Web Audio API failed, falling back to Audio element:', err)
        // Fallback to simple Audio element
        audioRef.current = () => {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHm8tiJOQgZqLvt52hEAw')
          audio.play().catch(e => console.log('Audio play failed:', e))
        }
      }
    }
  }, [])

  // Check for new orders and play notification sound
  useEffect(() => {
    if (!orders || orders.length === 0) return
    
    const currentOrderIds = new Set(orders.map(o => o.id))
    const newOrders = orders.filter(o => 
      !previousOrderIds.has(o.id) && o.status === 'new'
    )
    
    if (newOrders.length > 0) {
      // Play notification sound
      if (audioRef.current && typeof audioRef.current === 'function') {
        audioRef.current()
      }
      
      // Show browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order Received', {
          body: `${newOrders.length} new order${newOrders.length > 1 ? 's' : ''} received`,
          icon: '/favicon.ico'
        })
      }
    }
    
    setPreviousOrderIds(currentOrderIds)
  }, [orders?.map(o => o.id).join(',')]) // Stable dependency

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Get new orders using shared context
  const newOrders = getNewOrders()
  const unreadCount = newOrders.length

  if (!clientId) return null

  return (
    <div style={{ position: 'relative' }}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 40,
          height: 40,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = C.card
          e.currentTarget.style.borderColor = C.acc
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = C.panel
          e.currentTarget.style.borderColor = C.border
        }}
      >
        <Bell size={18} color={C.t2} />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: C.red,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 10,
            minWidth: 16,
            textAlign: 'center',
            lineHeight: 1
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 380,
            maxHeight: 400,
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} color={C.acc} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>
                  New Orders
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: 12,
                    color: C.t2,
                    background: `${C.acc}20`,
                    padding: '2px 8px',
                    borderRadius: 12
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: 24,
                  height: 24,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  color: C.t2
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Orders List */}
            <div style={{
              maxHeight: 320,
              overflowY: 'auto'
            }}>
              {newOrders.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: C.t3
                }}>
                  <ShoppingCart size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    No new orders
                  </div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
                    You'll see new orders here when they arrive
                  </div>
                </div>
              ) : (
                newOrders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: `1px solid ${C.border}20`,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.card
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                    onClick={() => {
                      // Navigate to operations page
                      window.location.href = `/operations?site=${clientId}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: C.t0
                          }}>
                            #{order.orderNumber}
                          </span>
                          <span style={{
                            fontSize: 11,
                            color: '#fff',
                            background: C.acc,
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}>
                            New
                          </span>
                        </div>
                        
                        <div style={{ fontSize: 12, color: C.t2, marginBottom: 4 }}>
                          {order.customerName}
                        </div>
                        
                        <div style={{ fontSize: 11, color: C.t3, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          {formatTime(order.createdAt)}
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: C.t0
                        }}>
                          ${(order.total || 0).toFixed(2)}
                        </div>
                        <div style={{
                          fontSize: 10,
                          color: C.t3,
                          textTransform: 'capitalize',
                          marginTop: 2
                        }}>
                          {order.orderType}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {newOrders.length > 0 && (
              <div style={{
                padding: '12px 20px',
                borderTop: `1px solid ${C.border}`,
                background: C.card
              }}>
                <button
                  onClick={() => {
                    window.location.href = `/operations?site=${clientId}`
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: C.acc,
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  View All Orders
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Helper function to format time
function formatTime(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
}
