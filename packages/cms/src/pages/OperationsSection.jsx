import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { ShoppingCart, Bell, MapPin, Power, Clock, User, Phone, DollarSign, X, Check, ChefHat, Package, CheckCircle, XCircle } from 'lucide-react'
import { getOrders, updateOrderStatus } from '../api/orders'
import { getLocations } from '../api/locations'
import { toggleOrdering } from '../api/config'
import { C } from '../theme'

const STATUS_COLORS = {
  new: '#00D4FF',
  accepted: '#FFA500',
  preparing: '#FFD700',
  ready: '#00FF00',
  completed: '#008000',
  cancelled: '#FF0000'
}

const STATUS_LABELS = {
  new: 'New',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

const STATUS_FLOW = {
  new: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: []
}

// Helper functions (accessible to all components)
const formatDate = (dateStr) => {
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

const formatCurrency = (amount) => {
  return `$${(amount || 0).toFixed(2)}`
}

const getOrderProgressTime = (order) => {
  if (!order.acceptedAt && !order.preparingAt && !order.readyAt) return null
  
  const now = new Date()
  let startTime = order.createdAt
  let statusText = ''
  let progressPercent = 0
  
  if (order.acceptedAt) {
    startTime = new Date(order.acceptedAt)
    statusText = 'Accepted'
    progressPercent = 25
  }
  if (order.preparingAt) {
    startTime = new Date(order.preparingAt)
    statusText = 'Preparing'
    progressPercent = 50
  }
  if (order.readyAt) {
    startTime = new Date(order.readyAt)
    statusText = 'Ready'
    progressPercent = 75
  }
  if (order.completedAt) {
    startTime = new Date(order.completedAt)
    statusText = 'Completed'
    progressPercent = 100
  }
  
  const diffMs = now - startTime
  const diffMins = Math.floor(diffMs / 60000)
  
  console.log('Order progress for', order.id, 'status:', order.status, 'progress:', statusText)
  
  return {
    statusText,
    progressPercent,
    timeElapsed: diffMins < 1 ? 'Just now' : `${diffMins}m`
  }
}

export default function OperationsSection({ clientId }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [orderingEnabled, setOrderingEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('live')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [previousOrderIds, setPreviousOrderIds] = useState(new Set())
  const queryClient = useQueryClient()
  const audioRef = useRef(null)

  // Fetch config to get initial ordering state
  const { data: config } = useQuery({
    queryKey: ['config', clientId],
    queryFn: () => getConfig(clientId),
    staleTime: 1000 * 60 * 5
  })

  // Set initial ordering enabled state from config
  useEffect(() => {
    if (config?.ordering?.enabled !== undefined) {
      setOrderingEnabled(config.ordering.enabled)
    }
  }, [config])

  // Fetch locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', clientId],
    queryFn: () => getLocations(clientId),
    staleTime: 1000 * 60 * 5
  })

  // Set default location on load
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0].id)
    }
  }, [locations, selectedLocation])

  // Fetch live orders (new, accepted, preparing, ready)
  const { data: liveOrders = [], isLoading: liveLoading } = useQuery({
    queryKey: ['orders', clientId, selectedLocation, 'live'],
    queryFn: () => getOrders(clientId, null).then(orders =>
      orders.filter(o =>
        (!selectedLocation || o.locationId === selectedLocation) &&
        ['new', 'accepted', 'preparing', 'ready'].includes(o.status)
      )
    ),
    refetchInterval: 5000, // Poll every 5 seconds for faster updates
    enabled: !!selectedLocation
  })

  // Check for new orders and play notification sound
  useEffect(() => {
    if (!liveOrders || liveOrders.length === 0) return
    
    const currentOrderIds = new Set(liveOrders.map(o => o.id))
    const newOrders = liveOrders.filter(o => 
      !previousOrderIds.has(o.id) && o.status === 'new'
    )
    
    if (newOrders.length > 0) {
      // Play notification sound
      playNotificationSound()
      // Show browser notification
      showBrowserNotification(newOrders.length)
    }
    
    setPreviousOrderIds(currentOrderIds)
  }, [liveOrders?.map(o => o.id).join(',')]) // Stable dependency

  // Keep playing sound for unaccepted new orders
  useEffect(() => {
    if (!liveOrders) return
    
    const unacceptedOrdersCount = liveOrders.filter(o => o.status === 'new').length
    
    if (unacceptedOrdersCount > 0) {
      // Play sound every 5 seconds for unaccepted orders
      const soundInterval = setInterval(() => {
        playNotificationSound()
      }, 5000)
      
      // Store interval ID for cleanup
      window.currentSoundInterval = soundInterval
    } else {
      // Clear interval if no unaccepted orders
      if (window.currentSoundInterval) {
        clearInterval(window.currentSoundInterval)
        window.currentSoundInterval = null
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (window.currentSoundInterval) {
        clearInterval(window.currentSoundInterval)
        window.currentSoundInterval = null
      }
    }
  }, [liveOrders?.filter(o => o.status === 'new').length]) // Stable dependency

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
        
        console.log('Audio initialized with Web Audio API')
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

  const playNotificationSound = () => {
    if (audioRef.current && typeof audioRef.current === 'function') {
      audioRef.current()
    }
  }

  const showBrowserNotification = (orderCount) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order Received', {
        body: `${orderCount} new order${orderCount > 1 ? 's' : ''} received`,
        icon: '/favicon.ico'
      })
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Fetch history orders (completed, cancelled)
  const { data: historyOrders = [], isLoading: historyLoading } = useQuery({
    queryKey: ['orders', clientId, selectedLocation, 'history'],
    queryFn: () => getOrders(clientId, null).then(orders =>
      orders.filter(o =>
        (!selectedLocation || o.locationId === selectedLocation) &&
        ['completed', 'cancelled'].includes(o.status)
      )
    ),
    enabled: !!selectedLocation && activeTab === 'history'
  })

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus(clientId, orderId, status),
    onSuccess: (_, { status }) => {
      // Invalidate both live and history queries for immediate update
      queryClient.invalidateQueries(['orders', clientId, selectedLocation, 'live'])
      queryClient.invalidateQueries(['orders', clientId, selectedLocation, 'history'])
      queryClient.invalidateQueries(['orders', clientId])
      
      // Keep user on live orders tab - don't auto-switch to history
      // if (status === 'completed' || status === 'cancelled') {
      //   setActiveTab('history')
      // }
    }
  })

  // Toggle ordering mutation
  const toggleOrderingMutation = useMutation({
    mutationFn: (enabled) => toggleOrdering(clientId, enabled, selectedLocation),
    onSuccess: (data) => {
      setOrderingEnabled(prev => !prev)
      console.log('Ordering toggle successful:', data)
    },
    onError: (error) => {
      console.error('Ordering toggle failed:', error)
      alert('Failed to update ordering: ' + error.message)
    }
  })

  const handleStatusChange = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus })
    setSelectedOrder(null)
  }

  const handleToggleOrdering = () => {
    console.log('Toggle ordering clicked, current state:', orderingEnabled, 'new state:', !orderingEnabled)
    toggleOrderingMutation.mutate(!orderingEnabled)
  }

  const getOrderCountByStatus = (status) => {
    return liveOrders.filter(o => o.status === status).length
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.page }}>
      
      {/* Top Bar */}
      <div style={{ 
        background: C.panel, 
        borderBottom: `1px solid ${C.border}`,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.t0 }}>
            Operations
          </h1>
          
          {/* Location Selector */}
          {locations.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color={C.t2} />
              <select
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: C.input,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.t0,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  minWidth: 180
                }}
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Order Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Power size={16} color={orderingEnabled ? C.green : C.red} />
            <button
              onClick={handleToggleOrdering}
              disabled={toggleOrderingMutation.isPending}
              style={{
                padding: '8px 16px',
                background: orderingEnabled ? `${C.green}20` : `${C.red}20`,
                border: `1px solid ${orderingEnabled ? C.green : C.red}`,
                borderRadius: 8,
                color: orderingEnabled ? C.green : C.red,
                fontSize: 13,
                fontWeight: 600,
                cursor: toggleOrderingMutation.isPending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {orderingEnabled ? 'Orders Open' : 'Orders Closed'}
            </button>
          </div>

          {/* Notification Badge */}
          <div style={{ position: 'relative' }}>
            <Bell size={20} color={C.t2} />
            {getOrderCountByStatus('new') > 0 && (
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
                textAlign: 'center'
              }}>
                {getOrderCountByStatus('new')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        background: C.panel,
        borderBottom: `1px solid ${C.border}`,
        padding: '12px 24px',
        display: 'flex',
        gap: 24,
        flexShrink: 0
      }}>
        {['new', 'accepted', 'preparing', 'ready'].map(status => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: STATUS_COLORS[status]
            }} />
            <span style={{ fontSize: 13, color: C.t2 }}>
              {STATUS_LABELS[status]}: <strong style={{ color: C.t0 }}>{getOrderCountByStatus(status)}</strong>
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        background: C.panel,
        borderBottom: `1px solid ${C.border}`,
        padding: '0 24px',
        display: 'flex',
        flexShrink: 0
      }}>
        {['live', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '14px 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === tab ? `2px solid ${C.acc}` : '2px solid transparent',
              color: activeTab === tab ? C.t0 : C.t2,
              fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'live' ? `Live Orders (${liveOrders.length})` : `Order History (${historyOrders.length})`}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        
        {/* Live Orders */}
        {activeTab === 'live' && (
          <div>
            {liveLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>Loading orders...</div>
            ) : liveOrders.length === 0 ? (
              <div style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 60,
                textAlign: 'center'
              }}>
                <ShoppingCart size={48} color={C.t3} style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 16, color: C.t2, marginBottom: 8 }}>No live orders</div>
                <div style={{ fontSize: 13, color: C.t3 }}>New orders will appear here automatically</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {liveOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => setSelectedOrder(order)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order History */}
        {activeTab === 'history' && (
          <div>
            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>Loading history...</div>
            ) : historyOrders.length === 0 ? (
              <div style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 60,
                textAlign: 'center'
              }}>
                <Clock size={48} color={C.t3} style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 16, color: C.t2, marginBottom: 8 }}>No order history</div>
                <div style={{ fontSize: 13, color: C.t3 }}>Completed orders will appear here</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {historyOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => setSelectedOrder(order)}
                    onStatusChange={handleStatusChange}
                    isHistory
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

// Order Card Component
function OrderCard({ order, onClick, onStatusChange, isHistory = false }) {
  const statusColor = STATUS_COLORS[order.status]
  const statusLabel = STATUS_LABELS[order.status]

  // Helper functions inside component
  const formatDate = (dateStr) => {
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

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
          borderColor: C.acc,
          transform: 'translateY(-2px)'
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.acc
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>
            #{order.orderNumber}
          </div>
          <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>
            {formatDate(order.createdAt)}
          </div>
        </div>
        <span style={{
          background: `${statusColor}20`,
          color: statusColor,
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'capitalize'
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Customer Info */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <User size={14} color={C.t2} />
          <span style={{ fontSize: 13, color: C.t0 }}>{order.customerName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Phone size={14} color={C.t2} />
          <span style={{ fontSize: 13, color: C.t2 }}>{order.customerPhone}</span>
        </div>
      </div>

      {/* Order Progress */}
      {order.status !== 'new' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 4 }}>
            Order Progress
          </div>
          {(() => {
            const progress = getOrderProgressTime(order)
            if (!progress) return null
            
            return (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 4
                }}>
                  <span style={{ fontSize: 12, color: C.t2 }}>
                    {progress.statusText} - {progress.timeElapsed}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: 6,
                  background: C.border,
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progress.progressPercent}%`,
                    height: '100%',
                    background: STATUS_COLORS[order.status],
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Items Preview */}
      <div style={{ marginBottom: 12 }}>
        {order.items?.slice(0, 2).map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: C.t1, marginBottom: 4 }}>
            {item.quantity}x {item.name}
          </div>
        ))}
        {order.items?.length > 2 && (
          <div style={{ fontSize: 12, color: C.t3 }}>
            +{order.items.length - 2} more items
          </div>
        )}
      </div>

      {/* Total */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: 12,
        borderTop: `1px solid ${C.border}20`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DollarSign size={14} color={C.acc} />
          <span style={{ fontSize: 16, fontWeight: 800, color: C.t0 }}>
            {formatCurrency(order.total)}
          </span>
        </div>
        <span style={{ fontSize: 11, color: C.t3, textTransform: 'capitalize' }}>
          {order.orderType}
        </span>
      </div>

      {/* Accept/Decline buttons for new orders */}
      {order.status === 'new' && (
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${C.border}20`
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(order.id, 'accepted')
            }}
            style={{
              flex: 1,
              padding: '10px',
              background: C.green,
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Check size={16} />
            Accept Order
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(order.id, 'cancelled')
            }}
            style={{
              flex: 1,
              padding: '10px',
              background: C.red,
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <X size={16} />
            Decline Order
          </button>
        </div>
      )}
    </div>
  )
}

// Order Detail Modal
function OrderDetailModal({ order, onClose, onStatusChange }) {
  const statusColor = STATUS_COLORS[order.status]
  const statusLabel = STATUS_LABELS[order.status]
  const nextStatuses = STATUS_FLOW[order.status] || []

  // Helper functions inside component
  const formatDate = (dateStr) => {
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

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }} onClick={onClose}>
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          maxWidth: 500,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.t0 }}>
              Order #{order.orderNumber}
            </h2>
            <div style={{ fontSize: 13, color: C.t3, marginTop: 4 }}>
              {formatDate(order.createdAt)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.t3,
              fontSize: 24,
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: 20 }}>
          <span style={{
            background: `${statusColor}20`,
            color: statusColor,
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'capitalize'
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Customer Info */}
        <div style={{ marginBottom: 20, padding: 16, background: C.page, borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>
            Customer
          </div>
          <div style={{ fontSize: 14, color: C.t0, marginBottom: 4 }}>{order.customerName}</div>
          <div style={{ fontSize: 13, color: C.t2 }}>{order.customerEmail}</div>
          <div style={{ fontSize: 13, color: C.t2 }}>{order.customerPhone}</div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>
            Items
          </div>
          {order.items?.map((item, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '10px 0',
              borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}20` : 'none' 
            }}>
              <div>
                <div style={{ fontSize: 14, color: C.t0 }}>
                  {item.quantity}x {item.name}
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>
                    {item.modifiers.join(', ')}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.t0 }}>
                {formatCurrency(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ marginBottom: 20, padding: 16, background: C.page, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.t2 }}>Subtotal</span>
            <span style={{ fontSize: 14, color: C.t0 }}>{formatCurrency(order.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.t2 }}>Tax</span>
            <span style={{ fontSize: 14, color: C.t0 }}>{formatCurrency(order.taxAmount)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.t2 }}>Delivery Fee</span>
              <span style={{ fontSize: 14, color: C.t0 }}>{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}
          {order.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.t2 }}>Discount</span>
              <span style={{ fontSize: 14, color: C.green }}>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.acc }}>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Notes */}
        {order.note && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>
              Notes
            </div>
            <div style={{ fontSize: 13, color: C.t0, background: C.page, padding: 12, borderRadius: 8 }}>
              {order.note}
            </div>
          </div>
        )}

        {/* Status Actions */}
        {nextStatuses.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>
              Update Status
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {nextStatuses.map(status => (
                <button
                  key={status}
                  onClick={() => onStatusChange(order.id, status)}
                  style={{
                    padding: '10px 20px',
                    border: `1px solid ${STATUS_COLORS[status]}`,
                    background: `${STATUS_COLORS[status]}20`,
                    color: STATUS_COLORS[status],
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textTransform: 'capitalize',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {status === 'accepted' && <Check size={14} />}
                  {status === 'cancelled' && <X size={14} />}
                  {status === 'preparing' && <ChefHat size={14} />}
                  {status === 'ready' && <Package size={14} />}
                  {status === 'completed' && <CheckCircle size={14} />}
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
