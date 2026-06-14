import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { ShoppingCart, Bell, MapPin, Power, Clock, User, Phone, DollarSign, X, Check, ChefHat, Package, CheckCircle, XCircle, Table, Calendar } from 'lucide-react'
import { getOrders, updateOrderStatus } from '../api/orders'
import { getLocations } from '../api/locations'
import { toggleOrdering, getConfig } from '../api/config'
import { getTables, updateTableBookingStatus } from '../api/tables'
import { getBookings, updateBookingStatus, deleteBooking } from '../api/bookings'
import { C } from '../theme'
import ReservationsManager from './ReservationsManager'

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

  const timeStr = date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  const dateDisplay = date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })

  if (diffMins < 1) return `Just now (${timeStr})`
  if (diffMins < 60) return `${diffMins}m ago (${timeStr})`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago (${timeStr})`
  return `${dateDisplay} ${timeStr}`
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

  // Check order.status first to determine current state, then use timestamps
  if (order.status === 'completed' || order.completedAt) {
    startTime = order.completedAt ? new Date(order.completedAt) : startTime
    statusText = 'Completed'
    progressPercent = 100
  } else if (order.status === 'ready' || order.readyAt) {
    startTime = order.readyAt ? new Date(order.readyAt) : startTime
    statusText = 'Ready'
    progressPercent = 75
  } else if (order.status === 'preparing' || order.preparingAt) {
    startTime = order.preparingAt ? new Date(order.preparingAt) : startTime
    statusText = 'Preparing'
    progressPercent = 50
  } else if (order.status === 'accepted' || order.acceptedAt) {
    startTime = order.acceptedAt ? new Date(order.acceptedAt) : startTime
    statusText = 'Order Accepted'
    progressPercent = 25
  }

  // Don't show time elapsed for completed orders
  if (order.status === 'completed' || order.completedAt) {
    return {
      statusText,
      progressPercent,
      timeElapsed: null
    }
  }

  const diffMs = now - startTime
  const diffMins = Math.floor(diffMs / 60000)

  return {
    statusText,
    progressPercent,
    timeElapsed: diffMins < 1 ? 'Just now' : `${diffMins}m`
  }
}

export default function OperationsSection({ clientId, user: userProp }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [orderingEnabled, setOrderingEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('live')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [previousOrderIds, setPreviousOrderIds] = useState(new Set())
  const queryClient = useQueryClient()
  const audioRef = useRef(null)
  
  // Check if current user is a client
  const user = userProp || JSON.parse(localStorage.getItem('dd_user') || '{}')
  const isClient = user.role === 'CLIENT'
  const isSuperAdmin = user.role === 'SUPER_ADMIN'

  // Get user's allowed location IDs for this client
  const userAccessEntry = user?.clientAccess?.[clientId]
  const userLocationIds = Array.isArray(userAccessEntry) ? [] : (userAccessEntry?.locationIds || [])
  const hasLocationRestriction = !isSuperAdmin && userLocationIds.length > 0

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
  const { data: allLocations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', clientId],
    queryFn: () => getLocations(clientId),
    staleTime: 1000 * 60 * 5
  })

  // Filter locations based on user access
  const locations = hasLocationRestriction
    ? allLocations.filter(loc => userLocationIds.includes(loc.id))
    : allLocations

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
    enabled: !!selectedLocation,
    staleTime: 10 * 1000, // 10 seconds for live orders
    gcTime: 5 * 60 * 1000 // Keep for 5 minutes
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
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const notification = new Notification('New Order Received', {
          body: `${orderCount} new order${orderCount > 1 ? 's' : ''} received`,
          icon: '/favicon.ico',
          tag: 'new-order', // Prevent duplicate notifications
          requireInteraction: true, // Keep notification visible until user interacts
          badge: '/favicon.ico'
        })

        // Focus window when notification is clicked
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } else if (Notification.permission === 'default') {
        // Request permission if not granted
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showBrowserNotification(orderCount)
          }
        })
      }
    }
  }

  // Update document title with new order count
  useEffect(() => {
    const newOrderCount = liveOrders?.filter(o => o.status === 'new').length || 0
    const originalTitle = document.title

    if (newOrderCount > 0) {
      document.title = `(${newOrderCount}) New Order${newOrderCount > 1 ? 's' : ''} - Operations`
    } else {
      document.title = originalTitle
    }

    return () => {
      document.title = originalTitle
    }
  }, [liveOrders?.filter(o => o.status === 'new').length])

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission)
      })
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
    enabled: !!selectedLocation,
    staleTime: 60 * 1000, // 1 minute for history
    gcTime: 10 * 60 * 1000 // Keep for 10 minutes
  })

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', clientId, selectedLocation],
    queryFn: () => getBookings(clientId).then(data =>
      data.filter(b => !selectedLocation || b.locationId === selectedLocation)
    ),
    enabled: !!selectedLocation,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000
  })

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }) => updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', clientId, selectedLocation])
    },
    onError: (error) => {
      console.error('[CMS] Booking status update failed:', error)
      alert('Failed to update booking status: ' + error.message)
    }
  })

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: (bookingId) => deleteBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', clientId, selectedLocation])
    },
    onError: (error) => {
      console.error('[CMS] Booking deletion failed:', error)
      alert('Failed to delete booking: ' + error.message)
    }
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

  // Calculate today's revenue for clients
  const getTodayRevenue = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayOrders = liveOrders.filter(o => 
      new Date(o.createdAt) >= today && o.status === 'completed'
    )
    return todayOrders.reduce((sum, order) => sum + order.total, 0)
  }

  // Calculate average order value
  const getAverageOrderValue = () => {
    const completedOrders = liveOrders.filter(o => o.status === 'completed')
    if (completedOrders.length === 0) return 0
    const total = completedOrders.reduce((sum, order) => sum + order.total, 0)
    return total / completedOrders.length
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
        {['live', 'history', 'tables', 'analytics', 'customers'].map(tab => (
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
            {tab === 'live' && `Live Orders (${liveOrders.length})`}
            {tab === 'history' && `Order History (${historyOrders.length})`}
            {tab === 'tables' && 'Tables'}
            {tab === 'analytics' && 'Analytics'}
            {tab === 'customers' && 'Customers'}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        
        {/* Client Dashboard */}
        {isClient && (
          <div style={{ 
            background: C.panel, 
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: C.t0, 
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.07em'
            }}>
              Today's Performance
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{ 
                background: C.card, 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: C.green,
                  marginBottom: '4px' 
                }}>
                  ${getTodayRevenue().toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: C.t2 }}>Today's Revenue</div>
              </div>
              <div style={{ 
                background: C.card, 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: C.acc,
                  marginBottom: '4px' 
                }}>
                  {getOrderCountByStatus('completed')}
                </div>
                <div style={{ fontSize: '12px', color: C.t2 }}>Orders Completed</div>
              </div>
              <div style={{ 
                background: C.card, 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: C.t0,
                  marginBottom: '4px' 
                }}>
                  ${getAverageOrderValue().toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: C.t2 }}>Average Order</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: C.t2, lineHeight: '1.5' }}>
              Manage your orders efficiently with real-time notifications and status updates.
            </div>
          </div>
        )}
        
        {/* Live Orders */}
        {activeTab === 'live' && (
          <div>
            {liveLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>Loading orders...</div>
            ) : liveOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>
                {isClient ? 'No orders yet. You\'ll see new orders here when customers place them!' : 'No live orders'}
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '16px' 
              }}>
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
          <OrderHistorySection
            historyOrders={historyOrders}
            onOrderClick={setSelectedOrder}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Tables with Bookings - Reservations Manager */}
        {activeTab === 'tables' && (
          <ReservationsManager
            clientId={clientId}
            selectedLocation={selectedLocation}
            clientData={{ name: 'Restaurant' }}
          />
        )}

        {/* Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <AnalyticsSection 
            liveOrders={liveOrders}
            historyOrders={historyOrders}
          />
        )}

        {/* Customer Management */}
        {activeTab === 'customers' && (
          <CustomersSection 
            historyOrders={historyOrders}
            clientId={clientId}
          />
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
    
    const timeStr = date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    const dateDisplay = date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
    
    if (diffMins < 1) return `Just now (${timeStr})`
    if (diffMins < 60) return `${diffMins}m ago (${timeStr})`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago (${timeStr})`
    return `${dateDisplay} ${timeStr}`
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
          {order.pickupTime && (
            <div style={{ fontSize: 11, color: C.acc, fontWeight: 600, marginTop: 2 }}>
              🕐 Scheduled: {new Date(order.pickupTime).toLocaleString('en-AU', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
          <span style={{
            background: order.paymentStatus === 'paid' ? `${C.green}20` : `${C.red}20`,
            color: order.paymentStatus === 'paid' ? C.green : C.red,
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'capitalize'
          }}>
            {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
          </span>
        </div>
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
                    {progress.statusText}{progress.timeElapsed ? ` - ${progress.timeElapsed}` : ''}
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
        {order.items?.slice(0, 3).map((item, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 13, color: C.t0, fontWeight: 600 }}>
              {item.quantity}x {item.name}
            </div>
            {item.selectedSize && (
              <div style={{ fontSize: 11, color: C.t3, marginLeft: 12 }}>
                Size: {item.selectedSize.name}{item.selectedSize.priceAdjustment > 0 ? ` +$${parseFloat(item.selectedSize.priceAdjustment).toFixed(2)}` : ''}
              </div>
            )}
            {item.selectedAddons && item.selectedAddons.length > 0 && (
              <div style={{ fontSize: 11, color: C.t3, marginLeft: 12 }}>
                {item.selectedAddons.map(a => `${a.name}${a.price > 0 ? ` +$${parseFloat(a.price).toFixed(2)}` : ''}`).join(' · ')}
              </div>
            )}
            {item.specialInstructions && (
              <div style={{ fontSize: 11, color: C.acc, marginLeft: 12, fontStyle: 'italic' }}>
                Note: {item.specialInstructions}
              </div>
            )}
          </div>
        ))}
        {order.items?.length > 3 && (
          <div style={{ fontSize: 11, color: C.t3 }}>
            +{order.items.length - 3} more items
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {order.tableNumber ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: C.acc, background: `${C.acc}18`, padding: '3px 10px', borderRadius: 20 }}>
              Table {order.tableNumber}
            </span>
          ) : (
            <>
              <MapPin size={12} color={C.t2} />
              <span style={{ fontSize: 11, color: C.t2 }}>
                {order.orderType === 'dine_in' ? 'Dine-in' : order.orderType === 'pickup' ? 'Pick-up' : order.orderType?.charAt(0).toUpperCase() + order.orderType?.slice(1)}
              </span>
            </>
          )}
        </div>
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

// Analytics Dashboard Component with time period filtering
function AnalyticsSection({ liveOrders, historyOrders }) {
  const [timePeriod, setTimePeriod] = useState('today')

  // Helper function to get date range for time period
  const getDateRange = (period) => {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (period) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return { start: yesterday, end: today }
      case 'currentWeek':
        const currentWeekStart = new Date(today)
        const dayOfWeek = currentWeekStart.getDay()
        const diff = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        currentWeekStart.setDate(diff)
        return { start: currentWeekStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      case 'lastWeek':
        const lastWeekEnd = new Date(today)
        const lastWeekDay = lastWeekEnd.getDay()
        const lastWeekDiff = lastWeekEnd.getDate() - lastWeekDay + (lastWeekDay === 0 ? -6 : 1)
        const lastWeekStart = new Date(lastWeekEnd)
        lastWeekStart.setDate(lastWeekDiff - 7)
        lastWeekEnd.setDate(lastWeekDiff)
        return { start: lastWeekStart, end: lastWeekEnd }
      case 'currentMonth':
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        return { start: currentMonthStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1)
        return { start: lastMonthStart, end: lastMonthEnd }
      case 'all':
        return { start: new Date(0), end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      default:
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    }
  }

  // Filter orders based on selected time period (exclude 'new' orders from analytics)
  const { start, end } = getDateRange(timePeriod)
  const filteredOrders = [...liveOrders, ...historyOrders].filter(order => {
    if (!order.createdAt) return false
    if (order.status === 'new') return false // Exclude new orders from analytics
    const orderDate = new Date(order.createdAt)
    return orderDate >= start && orderDate < end
  })

  // Calculate revenue from filtered orders
  const periodRevenue = filteredOrders
    .reduce((sum, order) => sum + (order.total || 0), 0)

  const periodOrderCount = filteredOrders.length

  // Calculate average order value
  const averageOrderValue = periodOrderCount > 0 ? periodRevenue / periodOrderCount : 0

  // Calculate top selling items
  const itemCounts = {}
  filteredOrders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (!item) return
        const itemName = item.name || 'Unknown Item'
        const quantity = parseInt(item.quantity) || 1
        itemCounts[itemName] = (itemCounts[itemName] || 0) + quantity
      })
    }
  })

  const topItems = Object.entries(itemCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const periodLabels = {
    today: 'Today',
    yesterday: 'Yesterday',
    currentWeek: 'This Week',
    lastWeek: 'Last Week',
    currentMonth: 'This Month',
    lastMonth: 'Last Month',
    all: 'All Time'
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: C.t0, 
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.07em'
        }}>
          Analytics
        </h3>
        
        {/* Time Period Selector */}
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          style={{
            padding: '8px 12px',
            background: C.input,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.t0,
            fontSize: 13,
            fontFamily: 'inherit',
            cursor: 'pointer'
          }}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="currentWeek">This Week</option>
          <option value="lastWeek">Last Week</option>
          <option value="currentMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="all">All Time</option>
        </select>
      </div>
      
      {/* Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ 
          background: C.card, 
          padding: '20px', 
          borderRadius: '12px', 
          textAlign: 'center' 
        }}>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: C.green, 
            marginBottom: '8px' 
          }}>
            {periodOrderCount}
          </div>
          <div style={{ fontSize: '14px', color: C.t2 }}>Orders {periodLabels[timePeriod]}</div>
        </div>
        
        <div style={{ 
          background: C.card, 
          padding: '20px', 
          borderRadius: '12px', 
          textAlign: 'center' 
        }}>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: C.acc, 
            marginBottom: '8px' 
          }}>
            ${periodRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: '14px', color: C.t2 }}>Revenue {periodLabels[timePeriod]}</div>
        </div>
        
        <div style={{ 
          background: C.card, 
          padding: '20px', 
          borderRadius: '12px', 
          textAlign: 'center' 
        }}>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: C.t0, 
            marginBottom: '8px' 
          }}>
            ${averageOrderValue.toFixed(2)}
          </div>
          <div style={{ fontSize: '14px', color: C.t2 }}>Average Order</div>
        </div>
      </div>
      
      {/* Top Selling Items */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          color: C.t0, 
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.07em'
        }}>
          Top Selling Items {periodLabels[timePeriod]}
        </h4>
        <div style={{ 
          background: C.card, 
          borderRadius: '12px', 
          padding: '16px' 
        }}>
          {topItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.t3, padding: '20px' }}>
              No items sold {periodLabels[timePeriod].toLowerCase()}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topItems.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < topItems.length - 1 ? `1px solid ${C.border}20` : 'none'
                }}>
                  <span style={{ fontSize: '14px', color: C.t0 }}>{item.name}</span>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: C.acc 
                  }}>
                    {item.count} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Enhanced Customer Management Component (Loyalty Program)
function CustomersSection({ historyOrders, clientId }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  
  // Fetch loyalty config
  const { data: config } = useQuery({
    queryKey: ['config', clientId],
    queryFn: () => getLocations(clientId).then(() => ({})), // Simplified for now
    enabled: false // Disable for now, will implement properly
  })

  // Points earning rate (default 1 point per dollar, configurable)
  const pointsPerDollar = 1
  
  // Extract unique customers from orders (phone numbers as loyalty accounts)
  const customers = {}
  historyOrders.forEach(order => {
    const phone = order.customerPhone || 'No Phone'
    const email = order.customerEmail || 'No Email'
    const key = phone // Use phone number as unique identifier for loyalty
    
    if (!customers[key]) {
      customers[key] = {
        name: order.customerName,
        phone,
        email,
        orderCount: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        pointsEarned: 0,
        pointsUsed: 0,
        lastOrder: order.createdAt,
        firstOrder: order.createdAt,
        orders: [],
        averageOrderValue: 0,
        tier: 'Bronze'
      }
    }
    
    customers[key].orderCount += 1
    customers[key].totalSpent += order.total || 0
    
    // Calculate points earned (1 point per dollar)
    const pointsEarned = Math.floor((order.total || 0) * pointsPerDollar)
    customers[key].pointsEarned += pointsEarned
    
    // Handle points used from order
    if (order.pointsUsed) {
      customers[key].pointsUsed += order.pointsUsed
    }
    
    // Calculate net loyalty points
    customers[key].loyaltyPoints = customers[key].pointsEarned - customers[key].pointsUsed
    
    customers[key].orders.push(order)
    
    // Determine tier based on total spent
    if (customers[key].totalSpent >= 1000) {
      customers[key].tier = 'Gold'
    } else if (customers[key].totalSpent >= 500) {
      customers[key].tier = 'Silver'
    } else {
      customers[key].tier = 'Bronze'
    }
    
    // Update first order date if earlier
    const orderDate = new Date(order.createdAt)
    const firstOrderDate = new Date(customers[key].firstOrder)
    if (orderDate < firstOrderDate) {
      customers[key].firstOrder = order.createdAt
    }
    
    // Update last order date if more recent
    const lastOrderDate = new Date(customers[key].lastOrder)
    if (orderDate > lastOrderDate) {
      customers[key].lastOrder = order.createdAt
    }
  })
  
  // Calculate average order value for each customer
  Object.values(customers).forEach(customer => {
    customer.averageOrderValue = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0
  })
  
  // Filter customers based on search
  const filteredCustomers = Object.values(customers).filter(customer => {
    if (searchTerm === '') return true
    return customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.phone.includes(searchTerm) ||
           (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  })
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }
  
  const getTierColor = (tier) => {
    switch(tier) {
      case 'Gold': return '#FFD700'
      case 'Silver': return '#C0C0C0'
      case 'Bronze': return '#CD7F32'
      default: return '#999'
    }
  }
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.t0 }}>Customers</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.t3 }}>
            View customer loyalty and order history
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: C.t3 }}>
            {Object.keys(customers).length} total customers
          </span>
        </div>
      </div>
      
      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'inherit'
          }}
        />
      </div>
      
      {/* Customer List */}
      <div style={{ 
        background: C.card, 
        borderRadius: '12px', 
        overflow: 'hidden' 
      }}>
        {filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>
            No customers found
          </div>
        ) : (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredCustomers.map((customer, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px',
                  borderBottom: index < filteredCustomers.length - 1 ? `1px solid ${C.border}20` : 'none',
                  cursor: 'pointer',
                  ':hover': {
                    background: C.page
                  }
                }}
                onClick={() => setSelectedCustomer(customer)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.page
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: C.t0 
                    }}>
                      {customer.name}
                    </div>
                    <span style={{
                      background: `${getTierColor(customer.tier)}20`,
                      color: getTierColor(customer.tier),
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {customer.tier}
                    </span>
                    <span style={{
                      background: C.acc,
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {customer.loyaltyPoints} pts
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: C.t2, marginBottom: 4 }}>
                    📱 {customer.phone}
                  </div>
                  {customer.email && customer.email !== 'No Email' && (
                    <div style={{ fontSize: '12px', color: C.t2, marginBottom: 4 }}>
                      ✉️ {customer.email}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: C.t3 }}>
                    Member since: {formatDate(customer.firstOrder)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '150px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: C.t3, 
                    marginBottom: '4px' 
                  }}>
                    {customer.orderCount} orders
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: C.acc, 
                    marginBottom: '4px' 
                  }}>
                    ${customer.totalSpent.toFixed(2)}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: C.t3, 
                    marginBottom: '4px' 
                  }}>
                    Avg: ${customer.averageOrderValue.toFixed(2)}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: C.t3 
                  }}>
                    Last: {formatDate(customer.lastOrder)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedCustomer(null)}>
          <div style={{
            background: C.panel,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: C.t0, 
                  margin: 0,
                  marginBottom: 4
                }}>
                  {selectedCustomer.name}
                </h3>
                <span style={{
                  background: `${getTierColor(selectedCustomer.tier)}20`,
                  color: getTierColor(selectedCustomer.tier),
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {selectedCustomer.tier} Member
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: C.t3,
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Customer Info Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '16px', 
              marginBottom: '20px' 
            }}>
              <div style={{ padding: '12px', background: C.page, borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: C.t3, textTransform: 'uppercase', marginBottom: 4 }}>
                  Contact Info
                </div>
                <div style={{ fontSize: '13px', color: C.t0, marginBottom: 4 }}>
                  📱 {selectedCustomer.phone}
                </div>
                {selectedCustomer.email && selectedCustomer.email !== 'No Email' && (
                  <div style={{ fontSize: '13px', color: C.t0 }}>
                    ✉️ {selectedCustomer.email}
                  </div>
                )}
              </div>
              
              <div style={{ padding: '12px', background: C.page, borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: C.t3, textTransform: 'uppercase', marginBottom: 4 }}>
                  Loyalty Points
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: C.acc, marginBottom: 4 }}>
                  {selectedCustomer.loyaltyPoints} Points
                </div>
                <div style={{ fontSize: '11px', color: C.t3 }}>
                  Earned: {selectedCustomer.pointsEarned} | Used: {selectedCustomer.pointsUsed}
                </div>
              </div>
            </div>
            
            {/* Order Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '12px', 
              marginBottom: '20px' 
            }}>
              <div style={{ padding: '12px', background: C.page, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: C.green, marginBottom: 4 }}>
                  {selectedCustomer.orderCount}
                </div>
                <div style={{ fontSize: '11px', color: C.t3 }}>Orders</div>
              </div>
              
              <div style={{ padding: '12px', background: C.page, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: C.acc, marginBottom: 4 }}>
                  ${selectedCustomer.totalSpent.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: C.t3 }}>Total Spent</div>
              </div>
              
              <div style={{ padding: '12px', background: C.page, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: C.t0, marginBottom: 4 }}>
                  ${selectedCustomer.averageOrderValue.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: C.t3 }}>Avg Order</div>
              </div>
              
              <div style={{ padding: '12px', background: C.page, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: getTierColor(selectedCustomer.tier), marginBottom: 4 }}>
                  {selectedCustomer.tier}
                </div>
                <div style={{ fontSize: '11px', color: C.t3 }}>Tier</div>
              </div>
            </div>
            
            {/* Recent Orders */}
            <div>
              <h4 style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: C.t0, 
                marginBottom: '12px' 
              }}>
                Recent Orders (Last 10)
              </h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {selectedCustomer.orders.slice(-10).reverse().map((order, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: index < 9 ? `1px solid ${C.border}20` : 'none',
                    fontSize: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: C.t0 }}>
                        #{order.orderNumber}
                      </div>
                      <div style={{ color: C.t2 }}>
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: C.acc }}>
                        ${order.total.toFixed(2)}
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        color: C.t3,
                        textTransform: 'capitalize'
                      }}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Order History Component
function OrderHistorySection({ historyOrders, onOrderClick, onStatusChange }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  
  // Filter orders based on search, status, and date
  const filteredOrders = historyOrders.filter(order => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toString().includes(searchTerm) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm)
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    // Date filter
    const orderDate = new Date(order.createdAt)
    const today = new Date()
    let matchesDate = true
    
    if (dateFilter === 'today') {
      matchesDate = orderDate.toDateString() === today.toDateString()
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchesDate = orderDate >= weekAgo
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      matchesDate = orderDate >= monthAgo
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })
  
  return (
    <div>
      {/* Search and Filter Controls */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search by order #, name, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '10px 12px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'inherit'
          }}
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'inherit',
            minWidth: 120
          }}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'inherit',
            minWidth: 120
          }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      
      {/* Results count */}
      <div style={{ marginBottom: 16, fontSize: 13, color: C.t3 }}>
        Showing {filteredOrders.length} of {historyOrders.length} orders
      </div>
      
      {/* Order Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filteredOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onClick={() => onOrderClick(order)}
            onStatusChange={onStatusChange}
            isHistory
          />
        ))}
      </div>
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
              Received: {new Date(order.createdAt).toLocaleString('en-AU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
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

        {/* Status and Payment Badges */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
            <span style={{
              background: order.paymentStatus === 'paid' ? `${C.green}20` : `${C.red}20`,
              color: order.paymentStatus === 'paid' ? C.green : C.red,
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'capitalize'
            }}>
              {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
            </span>
          </div>
        </div>

        {/* Order Type / Table Info */}
        <div style={{ marginBottom: 16, padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          {order.tableNumber ? (
            <span style={{ fontSize: 13, fontWeight: 700, color: C.acc }}>
              Table {order.tableNumber}
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: C.t1, textTransform: 'uppercase' }}>
              {order.orderType === 'dine_in' ? 'Dine-in' : order.orderType === 'pickup' ? 'Pick-up' : order.orderType?.charAt(0).toUpperCase() + order.orderType?.slice(1)}
            </span>
          )}
          {!order.tableNumber && order.orderType !== 'dine_in' && (
            <span style={{ fontSize: 12, color: C.t2 }}>
              · {order.pickupTime ? new Date(order.pickupTime).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'ASAP'}
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.t2 }}>
            {order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod === 'stripe' ? 'Card' : order.paymentMethod}
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
                {item.selectedSize && (
                  <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>
                    Size: {item.selectedSize.name}{item.selectedSize.priceAdjustment > 0 ? ` (+$${parseFloat(item.selectedSize.priceAdjustment).toFixed(2)})` : ''}
                  </div>
                )}
                {item.selectedAddons && item.selectedAddons.length > 0 && (
                  <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>
                    {item.selectedAddons.map((a, j) => (
                      <div key={j}>+ {a.name}{a.price > 0 ? ` (+$${parseFloat(a.price).toFixed(2)})` : ''}</div>
                    ))}
                  </div>
                )}
                {item.specialInstructions && (
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 2, fontStyle: 'italic' }}>Note: {item.specialInstructions}</div>
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

// ── Tables Tab (combined with Bookings) ────────────────────────────────────────────────
function TablesTab({ clientId, selectedLocation, bookings, queryClient }) {
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables', clientId, selectedLocation],
    queryFn: () => getTables(clientId, selectedLocation),
    enabled: !!selectedLocation,
    refetchInterval: 10000
  })

  const updateBookingMutation = useMutation({
    mutationFn: ({ bookingId, status }) => updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', clientId, selectedLocation])
      queryClient.invalidateQueries(['tables', clientId, selectedLocation])
    },
    onError: (error) => {
      console.error('[CMS] Booking status update failed:', error)
      alert('Failed to update booking status: ' + error.message)
    }
  })

  const deleteBookingMutation = useMutation({
    mutationFn: (bookingId) => deleteBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', clientId, selectedLocation])
      queryClient.invalidateQueries(['tables', clientId, selectedLocation])
    },
    onError: (error) => {
      console.error('[CMS] Booking deletion failed:', error)
      alert('Failed to delete booking: ' + error.message)
    }
  })

  const updateTableBookingMutation = useMutation({
    mutationFn: ({ tableId, isBooked, bookingId }) =>
      updateTableBookingStatus(clientId, selectedLocation, tableId, { isBooked, bookingId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables', clientId, selectedLocation])
    },
    onError: (error) => {
      console.error('[CMS] Booking status update failed:', error)
      alert('Failed to update booking status: ' + error.message)
    }
  })

  const toggleBooking = (tableId, currentBookingId) => {
    if (currentBookingId) {
      // Unbook the table
      updateTableBookingMutation.mutate({
        tableId,
        isBooked: false
      })
    } else {
      // Book the table for walk-in (API will create a real booking record)
      updateTableBookingMutation.mutate({
        tableId,
        isBooked: true
      })
    }
  }

  if (!selectedLocation) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>
        Please select a location to view tables
      </div>
    )
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Loading tables...</div>
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const STATUS_COLORS = {
    pending: '#FFA500',
    confirmed: '#00FF00',
    cancelled: '#FF0000'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.t0 }}>Tables & Bookings</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.t3 }}>
            Manage tables and view assigned bookings
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {tables.map(table => {
          const now = new Date()
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          // Check if there's a current walk-in booking
          const hasWalkinBooking = !!table.bookingId
          const currentWalkinBooking = bookings.find(b => b.id === table.bookingId)

          // Check if there's an upcoming booking that should mark the table as occupied
          // Occupied if booking time is within 10 minutes from now
          const upcomingOccupyingBooking = bookings.find(b => {
            if (b.status === 'cancelled' || b.tableId !== table.id) return false
            const [year, month, day] = b.bookingDate.substring(0, 10).split('-')
            const bookingDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            if (bookingDay < today) return false // Past date

            const [hours, minutes] = b.bookingTime.split(':')
            const bookingTime = new Date(bookingDay)
            bookingTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

            // Occupied if booking is within 10 minutes from now
            const minutesUntilBooking = (bookingTime - now) / 60000
            return minutesUntilBooking <= 10 && minutesUntilBooking > -45 // Within 10 min before, up to 45 min after
          })

          const isCurrentlyOccupied = hasWalkinBooking || !!upcomingOccupyingBooking
          // All non-cancelled bookings assigned to this table, sorted soonest first
          const upcomingBookings = bookings
            .filter(b => {
              if (b.status === 'cancelled') return false
              if (b.tableId !== table.id) return false
              // Parse date as local date (strip time component)
              const [year, month, day] = b.bookingDate.substring(0, 10).split('-')
              const bookingDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
              return bookingDay >= today
            })
            .sort((a, b) => {
              const da = a.bookingDate.substring(0, 10) + 'T' + a.bookingTime
              const db = b.bookingDate.substring(0, 10) + 'T' + b.bookingTime
              return da.localeCompare(db)
            })

          return (
            <div key={table.id} style={{
              background: C.panel,
              border: `1px solid ${isCurrentlyOccupied ? `${C.amber}40` : C.border}`,
              borderRadius: 12,
              padding: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.t0 }}>Table {table.tableNumber}</div>
                  <div style={{ fontSize: 12, color: C.t2 }}>{table.capacity} seats</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: isCurrentlyOccupied ? `${C.amber}20` : `${C.green}20`,
                    color: isCurrentlyOccupied ? C.amber : C.green
                  }}>
                    {isCurrentlyOccupied ? 'Occupied' : 'Available'}
                  </span>
                  <span style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: table.isActive ? `${C.green}20` : `${C.red}20`,
                    color: table.isActive ? C.green : C.red
                  }}>
                    {table.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Current Occupying Booking (walk-in or upcoming reservation) */}
              {(currentWalkinBooking || upcomingOccupyingBooking) && (
                <div style={{ background: `${C.amber}10`, borderRadius: 8, padding: 12, marginBottom: 12, border: `1px solid ${C.amber}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 8 }}>
                    CURRENTLY OCCUPIED BY
                  </div>
                  {currentWalkinBooking && (
                    <div style={{ fontSize: 12, color: C.t0 }}>
                      <strong>{currentWalkinBooking.customerName}</strong> <span style={{ color: C.t3 }}>(Walk-in)</span>
                    </div>
                  )}
                  {upcomingOccupyingBooking && (
                    <div style={{ fontSize: 12, color: C.t0 }}>
                      <strong>{upcomingOccupyingBooking.customerName}</strong> <span style={{ color: C.t3 }}>(Reservation at {upcomingOccupyingBooking.bookingTime})</span>
                    </div>
                  )}
                </div>
              )}

              {/* Upcoming Bookings for this table */}
              {upcomingBookings.length > 0 && (
                <div style={{ background: C.card, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, marginBottom: 8 }}>
                    UPCOMING BOOKINGS ({upcomingBookings.length})
                  </div>
                  {upcomingBookings.map(booking => (
                    <div key={booking.id} style={{
                      padding: '10px',
                      background: C.page,
                      borderRadius: 6,
                      marginBottom: 6,
                      border: `1px solid ${booking.status === 'confirmed' ? `${C.green}40` : `${C.amber}40`}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.t0 }}>{booking.customerName}</div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: booking.status === 'confirmed' ? `${C.green}20` : `${C.amber}20`,
                          color: booking.status === 'confirmed' ? C.green : C.amber,
                          textTransform: 'uppercase'
                        }}>
                          {booking.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 2 }}>
                        📅 {formatDate(booking.bookingDate)} at {booking.bookingTime}
                      </div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: booking.customerEmail ? 2 : 6 }}>
                        👥 Party of {booking.partySize}
                      </div>
                      {booking.customerEmail && (
                        <div style={{ fontSize: 11, color: C.t2, marginBottom: booking.customerPhone ? 2 : 6 }}>
                          📧 {booking.customerEmail}
                        </div>
                      )}
                      {booking.customerPhone && (
                        <div style={{ fontSize: 11, color: C.t2, marginBottom: 6 }}>
                          📞 {booking.customerPhone}
                        </div>
                      )}
                      {booking.notes && (
                        <div style={{ fontSize: 11, color: C.t3, marginBottom: 6, fontStyle: 'italic' }}>
                          "{booking.notes}"
                        </div>
                      )}
                      {booking.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => updateBookingMutation.mutate({ bookingId: booking.id, status: 'confirmed' })}
                            style={{
                              flex: 1, padding: '5px', background: C.green, border: 'none',
                              borderRadius: 4, color: '#fff', fontWeight: 600, fontSize: 11,
                              cursor: 'pointer', fontFamily: 'inherit'
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => updateBookingMutation.mutate({ bookingId: booking.id, status: 'cancelled' })}
                            style={{
                              flex: 1, padding: '5px', background: C.red, border: 'none',
                              borderRadius: 4, color: '#fff', fontWeight: 600, fontSize: 11,
                              cursor: 'pointer', fontFamily: 'inherit'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Walk-in booking toggle */}
              <button
                onClick={() => toggleBooking(table.id, table.bookingId)}
                disabled={updateTableBookingMutation.isPending}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: isCurrentlyOccupied ? C.red : C.green,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  opacity: updateTableBookingMutation.isPending ? 0.5 : 1
                }}
              >
                {isCurrentlyOccupied ? 'Mark as Available' : 'Mark as Booked (Walk-in)'}
              </button>
            </div>
          )
        })}
      </div>

      {tables.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🪑</div>
          <div>No tables configured</div>
          <div style={{ fontSize: 12, marginTop: 4, color: C.t2 }}>
            Add tables in Config {'>'} Table Management
          </div>
        </div>
      )}
    </div>
  )
}

// Bookings Section Component
function BookingsSection({ bookings, isLoading, onStatusChange, onDelete }) {
  const [filter, setFilter] = useState('all')

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    return booking.status === filter
  })

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const STATUS_COLORS = {
    pending: '#FFA500',
    confirmed: '#00FF00',
    cancelled: '#FF0000'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.t0 }}>Bookings</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.t3 }}>
            View and manage table bookings
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'pending', 'confirmed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                border: `1px solid ${filter === status ? C.acc : C.border}`,
                background: filter === status ? `${C.acc}20` : 'transparent',
                color: filter === status ? C.acc : C.t2,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'capitalize'
              }}
            >
              {status} ({bookings.filter(b => status === 'all' || b.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>
          {filter === 'all' ? 'No bookings yet. Bookings made from your site will appear here.' : `No ${filter} bookings`}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
          {filteredBookings.map(booking => (
            <div key={booking.id} style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>{booking.customerName}</div>
                  <div style={{ fontSize: 12, color: C.t2 }}>{booking.customerPhone}</div>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: `${STATUS_COLORS[booking.status]}20`,
                  color: STATUS_COLORS[booking.status]
                }}>
                  {booking.status}
                </span>
              </div>

              <div style={{ fontSize: 12, color: C.t2, marginBottom: 8 }}>
                <div>📅 {formatDate(booking.bookingDate)} at {booking.bookingTime}</div>
                <div>👥 Party of {booking.partySize}</div>
                {booking.location && <div>📍 {booking.location.name}</div>}
                {booking.table && <div>🪑 Table {booking.table.tableNumber}</div>}
              </div>

              {booking.notes && (
                <div style={{ fontSize: 12, color: C.t2, marginBottom: 12, fontStyle: 'italic' }}>
                  "{booking.notes}"
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {booking.status === 'pending' && (
                  <button
                    onClick={() => onStatusChange(booking.id, 'confirmed')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: C.green,
                      border: 'none',
                      borderRadius: 6,
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Confirm
                  </button>
                )}
                {booking.status === 'pending' && (
                  <button
                    onClick={() => onStatusChange(booking.id, 'cancelled')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: C.red,
                      border: 'none',
                      borderRadius: 6,
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Delete this booking?')) {
                      onDelete(booking.id)
                    }
                  }}
                  style={{
                    padding: '8px',
                    background: 'transparent',
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    color: C.t2,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
