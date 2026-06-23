import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { ShoppingCart, Bell, MapPin, Power, Clock, User, Phone, DollarSign, X, Check, ChefHat, Package, CheckCircle, XCircle, Table, Calendar, RotateCcw } from 'lucide-react'
import { getOrders, updateOrderStatus } from '../api/orders'
import { refundOrder } from '../api/payments'
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
  accepted: ['preparing', 'new', 'cancelled'],
  preparing: ['new', 'ready', 'cancelled'],
  ready: ['preparing', 'completed'],
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

export default function OperationsSection({ clientId, user: userProp }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [orderingEnabled, setOrderingEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('live')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [refundOrder, setRefundOrder] = useState(null)
  const [previousOrderIds, setPreviousOrderIds] = useState(new Set())
  const queryClient = useQueryClient()
  const audioRef = useRef(null)
  const soundIntervalRef = useRef(null)
  
  // Check if current user is a client
  const user = userProp || {}
  const isClient = user.role === 'CLIENT'
  const isSuperAdmin = user.role === 'SUPER_ADMIN'

  // Get user's allowed location IDs for this client (fresh from /auth/me via authStore)
  const userAccessEntry = user?.clientAccess?.[clientId]
  const userLocationIds = Array.isArray(userAccessEntry) ? [] : (userAccessEntry?.locationIds || [])
  const hasLocationRestriction = !isSuperAdmin && !isClient && userLocationIds.length > 0

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

  // Fetch locations — keyed by user so each user gets their own cache
  const { data: allLocations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', clientId, user?.id],
    queryFn: () => getLocations(clientId),
    staleTime: 1000 * 60 * 5,
    enabled: !!user?.id
  })

  // Filter locations based on user access
  const locations = hasLocationRestriction
    ? allLocations.filter(loc => userLocationIds.includes(loc.id))
    : allLocations

  // Set default location on load, and correct it when user restrictions are applied
  useEffect(() => {
    if (locations.length === 0) return
    // If no location selected yet, pick first allowed
    if (!selectedLocation) {
      setSelectedLocation(locations[0].id)
      return
    }
    // If current selectedLocation is not in the allowed list, reset to first allowed
    if (!locations.find(l => l.id === selectedLocation)) {
      setSelectedLocation(locations[0].id)
    }
  }, [locations])

  // Fetch live orders (new, accepted, preparing, ready)
  const { data: liveOrders = [], isLoading: liveLoading } = useQuery({
    queryKey: ['orders', clientId, selectedLocation, 'live'],
    queryFn: () => getOrders(clientId, null, selectedLocation).then(orders =>
      orders.filter(o => ['new', 'accepted', 'preparing', 'ready'].includes(o.status))
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
      // Play sound every 20 seconds for unaccepted orders
      soundIntervalRef.current = setInterval(() => {
        playNotificationSound()
      }, 20000)
    } else {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current)
        soundIntervalRef.current = null
      }
    }
    
    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current)
        soundIntervalRef.current = null
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

  // Scheduled order reminder: play sound when a scheduled accepted order is within 20 mins of pickup
  const scheduledReminderRef = useRef(new Set()) // Track which orders we've already reminded about
  useEffect(() => {
    if (!liveOrders || liveOrders.length === 0) return

    const checkScheduledReminders = () => {
      const now = new Date()
      const scheduledAccepted = liveOrders.filter(o =>
        o.status === 'accepted' && o.pickupTime
      )

      scheduledAccepted.forEach(order => {
        const minsLeft = Math.floor((new Date(order.pickupTime).getTime() - now.getTime()) / 60000)
        // Remind at 20 mins before and if overdue
        if (minsLeft <= 20 && !scheduledReminderRef.current.has(order.id)) {
          scheduledReminderRef.current.add(order.id)
          playNotificationSound()
          // Browser notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Scheduled Order Due Soon', {
              body: `Order #${order.orderNumber} is due at ${new Date(order.pickupTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} — start preparing!`,
              icon: '/favicon.ico',
              tag: `scheduled-${order.id}`,
              requireInteraction: true
            })
          }
        }
        // Reset reminder if order moves past 20 mins (e.g. time was changed)
        if (minsLeft > 20) {
          scheduledReminderRef.current.delete(order.id)
        }
      })

      // Clean up IDs for orders that are no longer in the list
      const currentIds = new Set(liveOrders.map(o => o.id))
      scheduledReminderRef.current.forEach(id => {
        if (!currentIds.has(id)) scheduledReminderRef.current.delete(id)
      })
    }

    checkScheduledReminders()
    const interval = setInterval(checkScheduledReminders, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [liveOrders])

  // Fetch history orders (completed, cancelled)
  const { data: historyOrders = [], isLoading: historyLoading } = useQuery({
    queryKey: ['orders', clientId, selectedLocation, 'history'],
    queryFn: () => getOrders(clientId, null, selectedLocation).then(orders =>
      orders.filter(o => ['completed', 'cancelled'].includes(o.status))
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

  // Update order status mutation with optimistic updates for instant feel
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus(clientId, orderId, status),
    onMutate: async ({ orderId, status }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries(['orders', clientId, selectedLocation, 'live'])
      await queryClient.cancelQueries(['orders', clientId, selectedLocation, 'history'])

      // Snapshot previous values for rollback
      const prevLive = queryClient.getQueryData(['orders', clientId, selectedLocation, 'live'])
      const prevHistory = queryClient.getQueryData(['orders', clientId, selectedLocation, 'history'])

      // Optimistically update live orders cache
      queryClient.setQueryData(['orders', clientId, selectedLocation, 'live'], (old = []) => {
        if (status === 'completed' || status === 'cancelled') {
          // Remove from live
          return old.filter(o => o.id !== orderId)
        }
        return old.map(o => o.id === orderId ? { ...o, status } : o)
      })

      // If completing, optimistically add to history
      if (status === 'completed' || status === 'cancelled') {
        queryClient.setQueryData(['orders', clientId, selectedLocation, 'history'], (old = []) => {
          const order = prevLive?.find(o => o.id === orderId)
          if (order) return [{ ...order, status }, ...old]
          return old
        })
      }

      return { prevLive, prevHistory }
    },
    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.prevLive) queryClient.setQueryData(['orders', clientId, selectedLocation, 'live'], context.prevLive)
      if (context?.prevHistory) queryClient.setQueryData(['orders', clientId, selectedLocation, 'history'], context.prevHistory)
    },
    onSettled: () => {
      // Refetch after settled to ensure server state is in sync
      queryClient.invalidateQueries(['orders', clientId, selectedLocation, 'live'])
      queryClient.invalidateQueries(['orders', clientId, selectedLocation, 'history'])
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

  // Calculate today's revenue for clients (from historyOrders which has completed/cancelled)
  const getTodayRevenue = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCompleted = historyOrders.filter(o => 
      new Date(o.createdAt) >= today && o.status === 'completed'
    )
    return todayCompleted.reduce((sum, order) => sum + (order.total || 0), 0)
  }

  // Calculate average order value (from all completed history orders)
  const getAverageOrderValue = () => {
    const completedOrders = historyOrders.filter(o => o.status === 'completed')
    if (completedOrders.length === 0) return 0
    const total = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    return total / completedOrders.length
  }

  // Count completed orders today (for client dashboard)
  const getCompletedTodayCount = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return historyOrders.filter(o => 
      new Date(o.createdAt) >= today && o.status === 'completed'
    ).length
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
          {locations.length > 1 && (
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
          {locations.length === 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color={C.t2} />
              <span style={{ fontSize: 13, color: C.t2 }}>{locations[0].name}</span>
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
                  {getCompletedTodayCount()}
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
        
        {/* Live Orders — Pipeline Board */}
        {activeTab === 'live' && (() => {
          const now = new Date()
          const todayStart = new Date(); todayStart.setHours(0,0,0,0)
          const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1)

          // Helper: is this a scheduled order with a future pickup time?
          const isScheduled = (o) => !!o.pickupTime
          // Helper: is pickup day today?
          const isPickupToday = (o) => {
            if (!o.pickupTime) return false
            const pt = new Date(o.pickupTime)
            return pt >= todayStart && pt < todayEnd
          }
          // Helper: minutes until pickup
          const minsUntilPickup = (o) => {
            if (!o.pickupTime) return Infinity
            return Math.floor((new Date(o.pickupTime).getTime() - now.getTime()) / 60000)
          }
          // Helper: is approaching (within 20 mins)
          const isApproaching = (o) => {
            const m = minsUntilPickup(o)
            return m >= 0 && m <= 20
          }

          // Filter: scheduled orders for future days are hidden ONLY if already accepted.
          // New (unaccepted) scheduled orders always show so staff can accept/decline them.
          const visibleLive = liveOrders.filter(o => {
            if (!isScheduled(o)) return true
            // Always show new/unaccepted scheduled orders so staff can act on them
            if (o.status === 'new') return true
            // For accepted scheduled orders: only show if pickup is today or overdue
            return isPickupToday(o) || new Date(o.pickupTime) < now
          })

          // New column: new + accepted — split into regular and scheduled-accepted (compact)
          // Scheduled orders within 20 mins get promoted to full-size cards
          const allNewCol = visibleLive.filter(o => o.status === 'new' || o.status === 'accepted')
          const isCompactScheduled = (o) => o.status === 'accepted' && isScheduled(o) && minsUntilPickup(o) > 20
          const regularNew = allNewCol.filter(o => !isCompactScheduled(o))
          const scheduledAccepted = allNewCol.filter(o => isCompactScheduled(o))
            .sort((a, b) => new Date(a.pickupTime) - new Date(b.pickupTime))

          const preparingOrders = visibleLive.filter(o => o.status === 'preparing')
          const readyOrders = visibleLive.filter(o => o.status === 'ready')
          const inProgressOrders = preparingOrders

          const completedToday = historyOrders.filter(o => o.status === 'completed' && new Date(o.createdAt) >= todayStart)
          const todayRevenue = completedToday.reduce((s, o) => s + (o.total || 0), 0)

          const PIPELINE_COLORS = {
            new: { main: '#BA7517', bg: 'rgba(186,117,23,0.12)' },
            preparing: { main: '#185FA5', bg: 'rgba(24,95,165,0.12)' },
            ready: { main: '#3B6D11', bg: 'rgba(59,109,17,0.12)' }
          }

          const VALID_DROPS = {
            new: ['preparing'],
            accepted: ['preparing'],
            preparing: ['new', 'ready'],
            ready: ['preparing', 'completed']
          }

          const elapsed = (dateStr) => {
            if (!dateStr) return ''
            const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
            if (m < 1) return 'just now'
            return `${m}m`
          }

          // Drag handlers
          const handleDragStart = (e, order, fromStage) => {
            e.dataTransfer.setData('orderId', order.id)
            e.dataTransfer.setData('fromStage', fromStage)
            e.dataTransfer.effectAllowed = 'move'
            requestAnimationFrame(() => { e.target.style.opacity = '0.4' })
          }
          const handleDragEnd = (e) => { e.target.style.opacity = '1' }

          const handleDragOver = (e, colStage) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }

          const handleDragEnter = (e, colStage) => {
            e.preventDefault()
            e.currentTarget.style.background = `${PIPELINE_COLORS[colStage]?.bg || 'transparent'}`
            e.currentTarget.style.outline = `2px dashed ${PIPELINE_COLORS[colStage]?.main || C.border}`
            e.currentTarget.style.outlineOffset = '-2px'
          }
          const handleDragLeave = (e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.outline = 'none'
          }

          const handleDrop = (e, toStage) => {
            e.preventDefault()
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.outline = 'none'
            const orderId = e.dataTransfer.getData('orderId')
            const fromStage = e.dataTransfer.getData('fromStage')
            if (!orderId || fromStage === toStage) return
            const allowed = VALID_DROPS[fromStage]
            if (allowed && allowed.includes(toStage)) {
              handleStatusChange(orderId, toStage)
            }
          }

          // Full-size pipeline card (regular orders + unaccepted new scheduled orders)
          const PipelineCard = ({ order, stage, actionLabel, actionColor, nextStatus }) => (
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, order, stage === 'new' && order.status === 'accepted' ? 'accepted' : stage)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedOrder(order)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.t3; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none' }}
              style={{
                background: C.card,
                border: `0.5px solid ${C.border}`,
                borderLeft: `3px solid ${PIPELINE_COLORS[stage].main}`,
                borderRadius: 10,
                padding: '14px 16px',
                cursor: 'grab',
                transition: 'border-color 0.15s, transform 0.15s, opacity 0.2s',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.t0 }}>#{order.orderNumber} · {order.customerName}</span>
                  <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>
                    {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType === 'dine_in' ? 'Dine-in' : 'Pick-up'}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: PIPELINE_COLORS[stage].main, fontVariantNumeric: 'tabular-nums' }}>
                  {elapsed(order.createdAt)}
                </span>
              </div>
              {order.pickupTime && (
                <div style={{ fontSize: 11, color: C.acc, fontWeight: 500, marginBottom: 6 }}>
                  Scheduled: {new Date(order.pickupTime).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 8, marginBottom: 8 }}>
                {order.items?.slice(0, 4).map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.t0, margin: '2px 0' }}>
                    {item.quantity}x {item.name}
                    {item.selectedAddons?.length > 0 && <span style={{ fontSize: 11, color: C.t3 }}> ({item.selectedAddons.map(a => a.name).join(', ')})</span>}
                  </div>
                ))}
                {order.items?.length > 4 && <div style={{ fontSize: 11, color: C.t3 }}>+{order.items.length - 4} more</div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: C.t0 }}>${(order.total || 0).toFixed(2)}</span>
                {order.paymentStatus === 'paid' && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(59,109,17,0.1)', color: '#3B6D11' }}>Paid</span>
                )}
              </div>
              {/* Action button */}
              {nextStatus && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, nextStatus) }}
                  style={{
                    width: '100%', marginTop: 10, padding: '7px 0', fontSize: 12, fontWeight: 500,
                    borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    background: actionColor, color: '#fff'
                  }}
                >
                  {actionLabel}
                </button>
              )}
              {/* New orders: Accept + Decline */}
              {stage === 'new' && order.status === 'new' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'accepted') }}
                    style={{ flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#3B6D11', color: '#fff' }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (window.confirm('Decline this order? This cannot be undone.')) handleStatusChange(order.id, 'cancelled') }}
                    style={{ flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500, borderRadius: 8, border: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', color: C.t2 }}
                  >
                    Decline
                  </button>
                </div>
              )}
              {/* Non-scheduled accepted orders: Start Preparing */}
              {stage === 'new' && order.status === 'accepted' && !isScheduled(order) && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(59,109,17,0.08)', border: '0.5px solid rgba(59,109,17,0.2)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B6D11' }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#3B6D11' }}>Accepted</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'preparing') }}
                    style={{ width: '100%', padding: '7px 0', fontSize: 12, fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#185FA5', color: '#fff' }}
                  >
                    Start Preparing
                  </button>
                </div>
              )}
            </div>
          )

          // Compact card for accepted scheduled orders (small footprint)
          const ScheduledCompactCard = ({ order }) => {
            const approaching = isApproaching(order)
            const mins = minsUntilPickup(order)
            const overdue = mins < 0
            const timeLabel = new Date(order.pickupTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
            const urgentColor = overdue ? '#DC2626' : approaching ? '#EA580C' : '#3B6D11'
            const urgentBg = overdue ? 'rgba(220,38,38,0.08)' : approaching ? 'rgba(234,88,12,0.08)' : 'rgba(59,109,17,0.06)'
            const urgentBorder = overdue ? 'rgba(220,38,38,0.3)' : approaching ? 'rgba(234,88,12,0.3)' : `${C.border}`

            return (
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, order, 'new')}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedOrder(order)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.t3 }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = urgentBorder }}
                style={{
                  background: urgentBg,
                  border: `0.5px solid ${urgentBorder}`,
                  borderLeft: `3px solid ${urgentColor}`,
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: 'grab',
                  transition: 'border-color 0.15s, opacity 0.2s',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: urgentColor, whiteSpace: 'nowrap' }}>{timeLabel}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.t0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>#{order.orderNumber} · {order.customerName}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>${(order.total || 0).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'preparing') }}
                    style={{
                      padding: '4px 10px', fontSize: 11, fontWeight: 500, borderRadius: 6,
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      background: approaching || overdue ? '#EA580C' : '#185FA5', color: '#fff'
                    }}
                  >
                    {overdue ? 'Overdue — Prepare' : approaching ? 'Due soon — Prepare' : 'Start Preparing'}
                  </button>
                </div>
                {(approaching || overdue) && (
                  <div style={{ fontSize: 10, fontWeight: 600, color: urgentColor, marginTop: 4 }}>
                    {overdue ? `Overdue by ${Math.abs(mins)}m` : `Due in ${mins}m`}
                  </div>
                )}
              </div>
            )
          }

          // Reusable column component with drop target
          const PipelineColumn = ({ stage, icon, label, orders, emptyText, cardProps, scheduledOrders }) => (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.t0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {icon} {label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: PIPELINE_COLORS[stage].bg, color: PIPELINE_COLORS[stage].main }}>
                  {orders.length + (scheduledOrders?.length || 0)}
                </span>
              </div>
              <div
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragEnter={(e) => handleDragEnter(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  minHeight: 80, borderRadius: 10, padding: 4,
                  transition: 'background 0.2s, outline 0.2s'
                }}
              >
                {orders.length === 0 && (!scheduledOrders || scheduledOrders.length === 0)
                  ? <div style={{ fontSize: 13, color: C.t3, textAlign: 'center', padding: '2rem 0' }}>{emptyText}</div>
                  : <>
                      {orders.map(o => <PipelineCard key={o.id} order={o} stage={stage} {...(cardProps || {})} />)}
                      {/* Scheduled accepted — compact section */}
                      {scheduledOrders && scheduledOrders.length > 0 && (
                        <div style={{ marginTop: orders.length > 0 ? 6 : 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, paddingLeft: 4 }}>
                            Scheduled ({scheduledOrders.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {scheduledOrders.map(o => <ScheduledCompactCard key={o.id} order={o} />)}
                          </div>
                        </div>
                      )}
                    </>
                }
              </div>
            </div>
          )

          return (
            <div style={{ padding: '4px 0' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 500, color: C.t0, margin: 0 }}>Live orders</h3>
                  <span style={{ fontSize: 13, color: C.t2 }}>
                    {new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} · {new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.t3 }}>Drag cards between columns</span>
                  <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, background: C.card, color: C.t2, border: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B6D11', display: 'inline-block' }} />
                    Live
                  </span>
                </div>
              </div>

              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
                  <span style={{ fontSize: 13, color: C.t2, display: 'block', marginBottom: 4 }}>New incoming</span>
                  <span style={{ fontSize: 26, fontWeight: 500, color: '#BA7517' }}>{allNewCol.length}</span>
                </div>
                <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
                  <span style={{ fontSize: 13, color: C.t2, display: 'block', marginBottom: 4 }}>Preparing</span>
                  <span style={{ fontSize: 26, fontWeight: 500, color: '#185FA5' }}>{inProgressOrders.length}</span>
                </div>
                <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
                  <span style={{ fontSize: 13, color: C.t2, display: 'block', marginBottom: 4 }}>Ready to collect</span>
                  <span style={{ fontSize: 26, fontWeight: 500, color: '#3B6D11' }}>{readyOrders.length}</span>
                </div>
                <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
                  <span style={{ fontSize: 13, color: C.t2, display: 'block', marginBottom: 4 }}>Completed today</span>
                  <span style={{ fontSize: 26, fontWeight: 500, color: C.t0 }}>{completedToday.length}</span>
                </div>
              </div>

              {/* Pipeline Columns */}
              {liveLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>Loading orders...</div>
              ) : visibleLive.length === 0 && completedToday.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.t3, fontSize: 14 }}>
                  {isClient ? 'No orders yet. New orders will appear here in real-time!' : 'No live orders'}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                    <PipelineColumn stage="new" icon={<Bell size={14} color="#BA7517" />} label="New" orders={regularNew} scheduledOrders={scheduledAccepted} emptyText="No new orders" />
                    <PipelineColumn stage="preparing" icon={<ChefHat size={14} color="#185FA5" />} label="Preparing" orders={inProgressOrders} emptyText="Nothing preparing" cardProps={{ actionLabel: 'Mark ready', actionColor: '#3B6D11', nextStatus: 'ready' }} />
                    <PipelineColumn stage="ready" icon={<CheckCircle size={14} color="#3B6D11" />} label="Ready" orders={readyOrders} emptyText="Nothing ready yet" cardProps={{ actionLabel: 'Collected ✓', actionColor: '#3B6D11', nextStatus: 'completed' }} />
                  </div>

                  {/* Completed Today */}
                  {completedToday.length > 0 && (
                    <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ padding: '10px 16px', background: C.page, borderBottom: `0.5px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.t0 }}>Completed today</span>
                        <span style={{ fontSize: 12, color: C.t2 }}>${todayRevenue.toFixed(2)} revenue</span>
                      </div>
                      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {completedToday.slice(0, 20).map((o, i) => (
                          <div key={o.id} onClick={() => setSelectedOrder(o)} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 16px', borderBottom: `0.5px solid ${C.border}40`, cursor: 'pointer'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 12, color: C.t2 }}>#{o.orderNumber}</span>
                              <span style={{ fontSize: 13, color: C.t0 }}>{o.customerName}</span>
                              <span style={{ fontSize: 12, color: C.t3 }}>{o.items?.map(it => `${it.quantity}x ${it.name}`).join(', ')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: C.t0 }}>${(o.total || 0).toFixed(2)}</span>
                              <span style={{ fontSize: 11, color: C.t3 }}>{new Date(o.createdAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })()}

        {/* Order History */}
        {activeTab === 'history' && (
          <OrderHistorySection
            historyOrders={historyOrders}
            onOrderClick={setSelectedOrder}
            onStatusChange={handleStatusChange}
            onRefund={setRefundOrder}
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
          onRefund={(order) => { setSelectedOrder(null); setRefundOrder(order) }}
        />
      )}

      {refundOrder && (
        <RefundModal
          order={refundOrder}
          clientId={clientId}
          onClose={() => setRefundOrder(null)}
          onSuccess={() => {
            setRefundOrder(null)
            queryClient.invalidateQueries(['orders', clientId, selectedLocation, 'live'])
            queryClient.invalidateQueries(['orders', clientId, selectedLocation, 'history'])
          }}
        />
      )}
    </div>
  )
}

// Order Card Component
function OrderCard({ order, onClick, onStatusChange, onRefund, isHistory = false }) {
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
            background: order.paymentStatus === 'paid' ? `${C.green}20` : order.paymentStatus === 'refunded' ? '#7c3aed20' : order.paymentStatus === 'partial_refund' ? '#f59e0b20' : `${C.red}20`,
            color: order.paymentStatus === 'paid' ? C.green : order.paymentStatus === 'refunded' ? '#a78bfa' : order.paymentStatus === 'partial_refund' ? '#f59e0b' : C.red,
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'capitalize'
          }}>
            {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'refunded' ? 'Refunded' : order.paymentStatus === 'partial_refund' ? 'Part. Refunded' : 'Unpaid'}
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

      {/* Order Status */}
      {order.status !== 'new' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 4 }}>
            Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[order.status] }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: C.t0 }}>{STATUS_LABELS[order.status]}</span>
            {order.createdAt && (
              <span style={{ fontSize: 11, color: C.t3 }}>
                · {(() => {
                  const m = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
                  return m < 1 ? 'just now' : `${m}m ago`
                })()}
              </span>
            )}
          </div>
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

      {/* Refund button for paid orders */}
      {order.paymentStatus === 'paid' && order.stripePaymentIntentId && (order.status === 'completed' || order.status === 'cancelled') && order.paymentStatus !== 'refunded' && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}20` }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRefund && onRefund(order)
            }}
            style={{
              width: '100%',
              padding: '9px',
              background: 'transparent',
              border: '1px solid #f59e0b',
              borderRadius: 8,
              color: '#f59e0b',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <RotateCcw size={13} />
            Issue Refund
          </button>
        </div>
      )}

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
  const [timePeriod, setTimePeriod] = useState('currentWeek')

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

  // Get previous period range for delta comparison
  const getPreviousPeriodRange = (period) => {
    const { start, end } = getDateRange(period)
    const duration = end.getTime() - start.getTime()
    return { start: new Date(start.getTime() - duration), end: start }
  }

  // Filter orders based on selected time period (exclude 'new' orders from analytics)
  const allOrders = [...liveOrders, ...historyOrders]
  const { start, end } = getDateRange(timePeriod)
  const filteredOrders = allOrders.filter(order => {
    if (!order.createdAt) return false
    if (order.status === 'new') return false
    const orderDate = new Date(order.createdAt)
    return orderDate >= start && orderDate < end
  })

  // Previous period orders for delta
  const prev = getPreviousPeriodRange(timePeriod)
  const prevOrders = allOrders.filter(order => {
    if (!order.createdAt || order.status === 'new') return false
    const d = new Date(order.createdAt)
    return d >= prev.start && d < prev.end
  })

  // Calculate metrics
  const periodRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const prevRevenue = prevOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const periodOrderCount = filteredOrders.length
  const prevOrderCount = prevOrders.length
  const averageOrderValue = periodOrderCount > 0 ? periodRevenue / periodOrderCount : 0

  // Unique customers
  const uniqueCustomers = new Set(filteredOrders.map(o => o.customerPhone || o.customerEmail || o.customerName).filter(Boolean)).size
  const prevUniqueCustomers = new Set(prevOrders.map(o => o.customerPhone || o.customerEmail || o.customerName).filter(Boolean)).size

  // Delta helper
  const getDelta = (current, previous) => {
    if (previous === 0 && current === 0) return { pct: 0, direction: 'flat' }
    if (previous === 0) return { pct: 100, direction: 'up' }
    const pct = Math.round(((current - previous) / previous) * 100)
    return { pct: Math.abs(pct), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
  }

  const orderDelta = getDelta(periodOrderCount, prevOrderCount)
  const revenueDelta = getDelta(periodRevenue, prevRevenue)
  const customerDelta = getDelta(uniqueCustomers, prevUniqueCustomers)

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

  // Calculate daily/hourly revenue based on selected time period
  const getDailyRevenue = () => {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    // For today, yesterday, this week, last week: show Mon-Sun weekly view
    if (timePeriod === 'today' || timePeriod === 'yesterday' || timePeriod === 'currentWeek' || timePeriod === 'lastWeek') {
      const weekPeriod = (timePeriod === 'lastWeek') ? 'lastWeek' : 'currentWeek'
      const { start: weekStart } = getDateRange(weekPeriod)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const dow = now.getDay()
      return days.map((dayLabel, index) => {
        const dayStart = new Date(weekStart)
        dayStart.setDate(weekStart.getDate() + index)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayStart.getDate() + 1)
        const rev = allOrders.filter(o => {
          if (!o.createdAt || o.status === 'new') return false
          const d = new Date(o.createdAt)
          return d >= dayStart && d < dayEnd
        }).reduce((s, o) => s + (o.total || 0), 0)
        const isCurrent = timePeriod === 'currentWeek' && index === (dow === 0 ? 6 : dow - 1)
        return { day: dayLabel, revenue: rev, isToday: isCurrent }
      })
    }

    // For month periods: show each day of the month
    if (timePeriod === 'currentMonth' || timePeriod === 'lastMonth') {
      const { start: monthStart, end: monthEnd } = getDateRange(timePeriod)
      const totalDays = Math.round((monthEnd - monthStart) / 86400000)
      const result = []
      for (let i = 0; i < totalDays; i++) {
        const dayStart = new Date(monthStart.getTime() + i * 86400000)
        const dayEnd = new Date(dayStart.getTime() + 86400000)
        const rev = allOrders.filter(o => {
          if (!o.createdAt || o.status === 'new') return false
          const d = new Date(o.createdAt)
          return d >= dayStart && d < dayEnd
        }).reduce((s, o) => s + (o.total || 0), 0)
        const isCurrent = timePeriod === 'currentMonth' && dayStart.toDateString() === todayStart.toDateString()
        result.push({ day: String(dayStart.getDate()), revenue: rev, isToday: isCurrent })
      }
      return result
    }

    // For 'all': group by month
    if (timePeriod === 'all') {
      const monthMap = {}
      allOrders.forEach(o => {
        if (!o.createdAt || o.status === 'new') return
        const d = new Date(o.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthMap[key] = (monthMap[key] || 0) + (o.total || 0)
      })
      const keys = Object.keys(monthMap).sort()
      if (keys.length === 0) return []
      const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      return keys.map(k => {
        const [, m] = k.split('-')
        return { day: months[parseInt(m) - 1], revenue: monthMap[k], isToday: k === nowKey }
      })
    }

    return []
  }

  // Calculate orders by hour for the filtered period
  const getOrdersByHour = () => {
    const hourCounts = {}
    filteredOrders.forEach(order => {
      if (!order.createdAt) return
      const h = new Date(order.createdAt).getHours()
      hourCounts[h] = (hourCounts[h] || 0) + 1
    })
    // Find the range of active hours
    const activeHours = Object.keys(hourCounts).map(Number).sort((a, b) => a - b)
    if (activeHours.length === 0) return []
    const minH = Math.max(0, activeHours[0] - 1)
    const maxH = Math.min(23, activeHours[activeHours.length - 1] + 1)
    const result = []
    for (let h = minH; h <= maxH; h++) {
      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
      result.push({ hour: label, count: hourCounts[h] || 0 })
    }
    return result
  }

  const dailyRevenue = getDailyRevenue()
  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1)
  const hourlyOrders = getOrdersByHour()
  const maxHourly = Math.max(...hourlyOrders.map(h => h.count), 1)

  // Delta badge component
  const DeltaBadge = ({ delta }) => {
    if (delta.direction === 'flat') return <span style={{ fontSize: 12, color: C.t3 }}>— vs last period</span>
    const color = delta.direction === 'up' ? '#16a34a' : '#dc2626'
    const arrow = delta.direction === 'up' ? '↑' : '↓'
    return <span style={{ fontSize: 12, color }}>{arrow} {delta.pct}% vs last period</span>
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 500, color: C.t0, margin: 0 }}>Analytics</h3>
        </div>
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          style={{
            padding: '7px 12px',
            background: C.input,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.t0,
            fontSize: 13,
            fontFamily: 'inherit',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="currentWeek">This week</option>
          <option value="lastWeek">Last week</option>
          <option value="currentMonth">This month</option>
          <option value="lastMonth">Last month</option>
          <option value="all">All time</option>
        </select>
      </div>
      
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* Total Orders */}
        <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <ShoppingCart size={14} color={C.t2} />
            <span style={{ fontSize: 13, color: C.t2 }}>Total orders</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, color: C.t0, marginBottom: 4 }}>{periodOrderCount}</div>
          <DeltaBadge delta={orderDelta} />
        </div>
        {/* Revenue */}
        <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <DollarSign size={14} color={C.t2} />
            <span style={{ fontSize: 13, color: C.t2 }}>Revenue</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, color: C.t0, marginBottom: 4 }}>${periodRevenue.toFixed(2)}</div>
          <DeltaBadge delta={revenueDelta} />
        </div>
        {/* Avg Order */}
        <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <Package size={14} color={C.t2} />
            <span style={{ fontSize: 13, color: C.t2 }}>Avg order</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, color: C.t0, marginBottom: 4 }}>${averageOrderValue.toFixed(2)}</div>
          <span style={{ fontSize: 12, color: C.t3 }}>per transaction</span>
        </div>
        {/* Customers */}
        <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <User size={14} color={C.t2} />
            <span style={{ fontSize: 13, color: C.t2 }}>Customers</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, color: C.t0, marginBottom: 4 }}>{uniqueCustomers}</div>
          <DeltaBadge delta={customerDelta} />
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div style={{ background: C.card, borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.t0 }}>{timePeriod === 'all' ? 'Monthly revenue' : 'Daily revenue'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: C.t2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#D85A30', display: 'inline-block' }} />
              Revenue (AUD)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: C.border, display: 'inline-block' }} />
              No sales
            </span>
          </div>
        </div>
        {/* Bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, gap: 6, paddingBottom: 4 }}>
          {dailyRevenue.map((day, i) => {
            const barH = maxRevenue > 0 ? (day.revenue / maxRevenue) * 150 : 0
            const hasRev = day.revenue > 0
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: hasRev ? C.t0 : 'transparent', minHeight: 14 }}>
                  ${day.revenue.toFixed(2)}
                </span>
                <div style={{
                  width: '100%', maxWidth: 36,
                  height: Math.max(barH, 4),
                  background: hasRev ? '#D85A30' : C.border,
                  borderRadius: '4px 4px 0 0',
                  opacity: hasRev ? (day.isToday ? 1 : 0.85) : 0.3,
                  transition: 'all 0.3s ease'
                }} />
                <span style={{ fontSize: 12, fontWeight: day.isToday ? 600 : 400, color: day.isToday ? C.t0 : C.t2 }}>
                  {day.day}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Two-column: Top Items + Orders by Hour */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Top Selling Items */}
        <div style={{ background: C.card, borderRadius: 10, padding: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.t0, display: 'block', marginBottom: 12 }}>Top selling items</span>
          {topItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.t3, padding: '24px 0', fontSize: 13 }}>
              No items sold this period
            </div>
          ) : (
            <div>
              {topItems.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < topItems.length - 1 ? `0.5px solid ${C.border}40` : 'none'
                }}>
                  <span style={{ fontSize: 13, color: C.t0 }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.t0 }}>{item.count} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders by Hour */}
        <div style={{ background: C.card, borderRadius: 10, padding: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: C.t0, display: 'block' }}>Orders by hour</span>
            <span style={{ fontSize: 11, color: C.t3 }}>
              {timePeriod === 'today' ? 'Today' : timePeriod === 'yesterday' ? 'Yesterday' : timePeriod === 'currentWeek' ? 'This week (avg)' : timePeriod === 'lastWeek' ? 'Last week (avg)' : timePeriod === 'currentMonth' ? 'This month (avg)' : timePeriod === 'lastMonth' ? 'Last month (avg)' : 'All time (avg)'}
            </span>
          </div>
          {hourlyOrders.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.t3, padding: '24px 0', fontSize: 13 }}>
              No orders this period
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, gap: 3, paddingBottom: 4 }}>
              {hourlyOrders.map((h, i) => {
                const barH = maxHourly > 0 ? (h.count / maxHourly) * 110 : 0
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
                    {h.count > 0 && <span style={{ fontSize: 10, fontWeight: 500, color: C.t2 }}>{h.count}</span>}
                    <div style={{
                      width: '100%', maxWidth: 24,
                      height: Math.max(barH, 3),
                      background: h.count > 0 ? '#D85A30' : C.border,
                      borderRadius: '3px 3px 0 0',
                      opacity: h.count > 0 ? 0.9 : 0.2,
                      transition: 'all 0.3s ease'
                    }} />
                    <span style={{ fontSize: 10, color: C.t2 }}>{h.hour}</span>
                  </div>
                )
              })}
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
  const [tierFilter, setTierFilter] = useState('')
  const [sortBy, setSortBy] = useState('revenue')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Points earning rate (default 1 point per dollar, configurable)
  const pointsPerDollar = 1
  
  // Extract unique customers from orders (phone numbers as loyalty accounts)
  const customersMap = {}
  historyOrders.forEach(order => {
    const phone = order.customerPhone || 'No Phone'
    const email = order.customerEmail || 'No Email'
    const key = phone
    
    if (!customersMap[key]) {
      customersMap[key] = {
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
    
    customersMap[key].orderCount += 1
    customersMap[key].totalSpent += order.total || 0
    const pointsEarned = Math.floor((order.total || 0) * pointsPerDollar)
    customersMap[key].pointsEarned += pointsEarned
    if (order.pointsUsed) customersMap[key].pointsUsed += order.pointsUsed
    customersMap[key].loyaltyPoints = customersMap[key].pointsEarned - customersMap[key].pointsUsed
    customersMap[key].orders.push(order)
    
    if (customersMap[key].totalSpent >= 1000) customersMap[key].tier = 'Gold'
    else if (customersMap[key].totalSpent >= 500) customersMap[key].tier = 'Silver'
    else customersMap[key].tier = 'Bronze'
    
    const orderDate = new Date(order.createdAt)
    if (orderDate < new Date(customersMap[key].firstOrder)) customersMap[key].firstOrder = order.createdAt
    if (orderDate > new Date(customersMap[key].lastOrder)) customersMap[key].lastOrder = order.createdAt
  })
  
  const allCustomers = Object.values(customersMap)
  allCustomers.forEach(c => { c.averageOrderValue = c.orderCount > 0 ? c.totalSpent / c.orderCount : 0 })

  // Stats
  const totalCustomers = allCustomers.length
  const goldMembers = allCustomers.filter(c => c.tier === 'Gold').length
  const totalRevenue = allCustomers.reduce((s, c) => s + c.totalSpent, 0)
  const repeatCustomers = allCustomers.filter(c => c.orderCount > 1).length

  // Filter + sort
  let filteredCustomers = allCustomers.filter(c => {
    const matchQ = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm) || (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchT = !tierFilter || c.tier === tierFilter
    return matchQ && matchT
  })
  if (sortBy === 'revenue') filteredCustomers.sort((a, b) => b.totalSpent - a.totalSpent)
  else if (sortBy === 'orders') filteredCustomers.sort((a, b) => b.orderCount - a.orderCount)
  else if (sortBy === 'points') filteredCustomers.sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
  else if (sortBy === 'recent') filteredCustomers.sort((a, b) => new Date(b.lastOrder) - new Date(a.lastOrder))

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const tierStyle = (tier) => {
    if (tier === 'Gold') return { bg: 'rgba(186,117,23,0.12)', color: '#BA7517', label: 'Gold' }
    if (tier === 'Silver') return { bg: 'rgba(100,100,110,0.12)', color: '#5F5E5A', label: 'Silver' }
    return { bg: 'rgba(154,91,48,0.12)', color: '#993C1D', label: 'Bronze' }
  }

  const avatarColor = (name) => {
    const colors = ['#D85A30','#185FA5','#0F6E56','#3B6D11','#854F0B','#993556','#534AB7']
    let h = 0; for (const ch of (name || '')) h = (h * 31 + ch.charCodeAt(0)) % colors.length
    return colors[Math.abs(h)]
  }

  const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const selectStyle = { padding: '7px 10px', background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, color: C.t0, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }

  // Unique tiers for filter
  const tiers = [...new Set(allCustomers.map(c => c.tier))]

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 500, color: C.t0, margin: 0 }}>Customers</h3>
          <span style={{ fontSize: 13, color: C.t2 }}>Loyalty, points & order history</span>
        </div>
        <span style={{ fontSize: 13, color: C.t2, background: C.card, padding: '6px 12px', borderRadius: 8, border: `0.5px solid ${C.border}` }}>
          {totalCustomers} customer{totalCustomers !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <User size={14} color={C.t2} />
            <span style={{ fontSize: 13, color: C.t2 }}>Total customers</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, color: C.t0 }}>{totalCustomers}</div>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <CheckCircle size={14} color={C.t2} />
            <span style={{ fontSize: 13, color: C.t2 }}>Gold members</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, color: C.t0 }}>{goldMembers}</div>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <DollarSign size={14} color={C.t2} />
            <span style={{ fontSize: 13, color: C.t2 }}>Total revenue</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, color: C.t0 }}>${totalRevenue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div style={{ background: C.card, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <RotateCcw size={14} color={C.t2} />
            <span style={{ fontSize: 13, color: C.t2 }}>Repeat customers</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, color: C.t0 }}>{repeatCustomers}</div>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: C.input, color: C.t0, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} style={selectStyle}>
          <option value="">All tiers</option>
          {tiers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
          <option value="revenue">Sort: Revenue</option>
          <option value="orders">Sort: Orders</option>
          <option value="points">Sort: Points</option>
          <option value="recent">Sort: Recent</option>
        </select>
      </div>

      {/* Customer List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
        {filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.t3, padding: '32px 0', fontSize: 14 }}>No customers match your search.</div>
        ) : filteredCustomers.map((customer, i) => {
          const ts = tierStyle(customer.tier)
          const av = avatarColor(customer.name)
          return (
            <div
              key={i}
              onClick={() => setSelectedCustomer(customer)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.t3 }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.border}` }}
              style={{
                background: C.card,
                border: `0.5px solid ${C.border}`,
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'border-color 0.15s'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, minWidth: 44, borderRadius: '50%',
                background: `${av}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 500, fontSize: 15, color: av
              }}>
                {initials(customer.name)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: C.t0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.name}</span>
                  <span style={{ background: ts.bg, color: ts.color, padding: '2px 8px', borderRadius: 99, fontSize: 11, whiteSpace: 'nowrap' }}>{ts.label}</span>
                  <span style={{ background: C.page, color: C.t2, padding: '2px 8px', borderRadius: 99, fontSize: 11, border: `0.5px solid ${C.border}` }}>{customer.loyaltyPoints} pts</span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: C.t2 }}>
                    <Phone size={12} style={{ marginRight: 3, verticalAlign: -1 }} />{customer.phone}
                  </span>
                  {customer.email && customer.email !== 'No Email' && (
                    <span style={{ fontSize: 12, color: C.t2 }}>
                      <span style={{ marginRight: 3 }}>@</span>{customer.email}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: C.t2 }}>
                    <Calendar size={12} style={{ marginRight: 3, verticalAlign: -1 }} />Since {fmtDate(customer.firstOrder)}
                  </span>
                </div>
              </div>

              {/* Revenue stats */}
              <div style={{ textAlign: 'right', minWidth: 120 }}>
                <div style={{ fontSize: 18, fontWeight: 500, color: C.t0, marginBottom: 2 }}>
                  ${customer.totalSpent.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: C.t2, marginBottom: 2 }}>
                  {customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''} · avg ${customer.averageOrderValue.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: C.t3 }}>Last: {fmtDate(customer.lastOrder)}</div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setSelectedCustomer(null)}>
          <div style={{
            background: C.panel, borderRadius: 12, padding: 24, maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: `${avatarColor(selectedCustomer.name)}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 500, fontSize: 17, color: avatarColor(selectedCustomer.name)
                }}>
                  {initials(selectedCustomer.name)}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 500, color: C.t0, margin: 0, marginBottom: 4 }}>{selectedCustomer.name}</h3>
                  <span style={{ background: tierStyle(selectedCustomer.tier).bg, color: tierStyle(selectedCustomer.tier).color, padding: '3px 10px', borderRadius: 99, fontSize: 12 }}>
                    {tierStyle(selectedCustomer.tier).label} Member
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'transparent', border: 'none', color: C.t3, cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            
            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, background: C.page, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.t3, textTransform: 'uppercase', marginBottom: 6 }}>Contact</div>
                <div style={{ fontSize: 13, color: C.t0, marginBottom: 4 }}><Phone size={12} style={{ marginRight: 4, verticalAlign: -1 }} />{selectedCustomer.phone}</div>
                {selectedCustomer.email && selectedCustomer.email !== 'No Email' && (
                  <div style={{ fontSize: 13, color: C.t0 }}><span style={{ marginRight: 4 }}>@</span>{selectedCustomer.email}</div>
                )}
              </div>
              <div style={{ padding: 12, background: C.page, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.t3, textTransform: 'uppercase', marginBottom: 6 }}>Loyalty Points</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: C.t0, marginBottom: 4 }}>{selectedCustomer.loyaltyPoints} pts</div>
                <div style={{ fontSize: 11, color: C.t3 }}>Earned: {selectedCustomer.pointsEarned} · Used: {selectedCustomer.pointsUsed}</div>
              </div>
            </div>
            
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Orders', value: selectedCustomer.orderCount, color: C.t0 },
                { label: 'Total Spent', value: `$${selectedCustomer.totalSpent.toFixed(2)}`, color: C.t0 },
                { label: 'Avg Order', value: `$${selectedCustomer.averageOrderValue.toFixed(2)}`, color: C.t0 },
                { label: 'Tier', value: selectedCustomer.tier, color: tierStyle(selectedCustomer.tier).color }
              ].map((s, i) => (
                <div key={i} style={{ padding: 12, background: C.page, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 500, color: s.color, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.t3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            
            {/* Recent Orders */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 500, color: C.t0, marginBottom: 10 }}>Recent Orders</h4>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {selectedCustomer.orders.slice(-10).reverse().map((order, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: i < 9 ? `0.5px solid ${C.border}40` : 'none', fontSize: 12
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, color: C.t0 }}>#{order.orderNumber}</div>
                      <div style={{ color: C.t2 }}>{fmtDate(order.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 500, color: C.t0 }}>${order.total.toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: C.t3, textTransform: 'capitalize' }}>{order.status}</div>
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
function OrderHistorySection({ historyOrders, onOrderClick, onStatusChange, onRefund }) {
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
            fontFamily: 'inherit',
            background: C.input,
            color: C.t0
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
            minWidth: 120,
            background: C.input,
            color: C.t0,
            cursor: 'pointer'
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
            minWidth: 120,
            background: C.input,
            color: C.t0,
            cursor: 'pointer'
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
            onRefund={onRefund}
            isHistory
          />
        ))}
      </div>
    </div>
  )
}

// RefundModal Component
function RefundModal({ order, clientId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [refundType, setRefundType] = useState('full')
  const [customAmount, setCustomAmount] = useState('')

  const handleRefund = async () => {
    setLoading(true)
    setError(null)
    try {
      const amount = refundType === 'partial' ? parseFloat(customAmount) : undefined
      if (refundType === 'partial' && (!amount || amount <= 0 || amount > order.total)) {
        setError(`Enter a valid amount between $0.01 and $${order.total.toFixed(2)}`)
        setLoading(false)
        return
      }
      await refundOrder(clientId, order.id, amount)
      onSuccess()
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Refund failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: 20
    }} onClick={onClose}>
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 12, maxWidth: 420, width: '100%', padding: 28
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.t0 }}>Issue Refund</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.t3 }}>Order #{order.orderNumber} · ${(order.total || 0).toFixed(2)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.t3, cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
            <input type='radio' value='full' checked={refundType === 'full'} onChange={() => setRefundType('full')} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.t0 }}>Full Refund</div>
              <div style={{ fontSize: 12, color: C.t3 }}>Refund the full ${(order.total || 0).toFixed(2)}</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type='radio' value='partial' checked={refundType === 'partial'} onChange={() => setRefundType('partial')} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.t0 }}>Partial Refund</div>
              <div style={{ fontSize: 12, color: C.t3 }}>Enter a custom amount</div>
            </div>
          </label>
        </div>

        {refundType === 'partial' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.t3, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Refund Amount ($)</label>
            <input
              type='number'
              min='0.01'
              max={order.total}
              step='0.01'
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              placeholder={`Max $${(order.total || 0).toFixed(2)}`}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: C.input, color: C.t0, boxSizing: 'border-box' }}
            />
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#450a0a', border: '1px solid #ef4444', borderRadius: 8, fontSize: 13, color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleRefund} disabled={loading} style={{
            flex: 1, padding: '12px', background: '#f59e0b', border: 'none', borderRadius: 8,
            color: '#000', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: loading ? 0.7 : 1
          }}>
            <RotateCcw size={15} />
            {loading ? 'Processing…' : 'Confirm Refund'}
          </button>
          <button onClick={onClose} style={{
            padding: '12px 20px', background: 'transparent', border: `1px solid ${C.border2}`,
            borderRadius: 8, color: C.t2, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
          }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// Order Detail Modal
function OrderDetailModal({ order, onClose, onStatusChange, onRefund }) {
  const statusColor = STATUS_COLORS[order.status]
  const statusLabel = STATUS_LABELS[order.status]
  // Filter status transitions: hide confusing backward transitions, keep only useful ones
  const allNext = STATUS_FLOW[order.status] || []
  const nextStatuses = allNext.filter(s => {
    // Always show cancel
    if (s === 'cancelled') return true
    // Hide 'new' (going back to unaccepted) — confusing for staff
    if (s === 'new') return false
    return true
  })

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
              background: order.paymentStatus === 'paid' ? `${C.green}20` : order.paymentStatus === 'refunded' ? '#7c3aed20' : order.paymentStatus === 'partial_refund' ? '#f59e0b20' : `${C.red}20`,
              color: order.paymentStatus === 'paid' ? C.green : order.paymentStatus === 'refunded' ? '#a78bfa' : order.paymentStatus === 'partial_refund' ? '#f59e0b' : C.red,
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'capitalize'
            }}>
              {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'refunded' ? 'Refunded' : order.paymentStatus === 'partial_refund' ? 'Partially Refunded' : 'Unpaid'}
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
          {!order.pickupTime && (
            <span style={{ fontSize: 12, color: C.t2 }}>· ASAP</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.t2 }}>
            {order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod === 'stripe' ? 'Card' : order.paymentMethod}
          </span>
        </div>

        {/* Scheduled Pickup Time */}
        {order.pickupTime && (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: `${C.acc}15`, border: `1px solid ${C.acc}40`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🕐</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.acc, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scheduled Order</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t0, marginTop: 2 }}>
                {new Date(order.pickupTime).toLocaleString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )}

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
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>
              Update Status
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {nextStatuses.map(status => (
                <button
                  key={status}
                  onClick={() => { if (status === 'cancelled') { if (window.confirm('Cancel this order? This cannot be undone.')) onStatusChange(order.id, status) } else { onStatusChange(order.id, status) } }}
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

        {/* Refund Action */}
        {order.paymentStatus === 'paid' && order.stripePaymentIntentId && onRefund && order.paymentStatus !== 'refunded' && (
          <div style={{ paddingTop: 12, borderTop: `1px solid ${C.border}20` }}>
            <button
              onClick={() => onRefund(order)}
              style={{
                padding: '10px 20px',
                border: '1px solid #f59e0b',
                background: '#f59e0b20',
                color: '#f59e0b',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <RotateCcw size={14} />
              Issue Refund
            </button>
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
