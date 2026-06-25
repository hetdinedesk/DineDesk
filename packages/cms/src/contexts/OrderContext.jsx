import { createContext, useContext, useEffect, useState } from 'react'
import { getOrders } from '../api/orders'
import { useSocket } from '../hooks/useSocket'

const OrderContext = createContext()

export function OrderProvider({ clientId, children }) {
  const [orders, setOrders] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchOrders = async () => {
    if (!clientId) return
    setIsLoading(true)
    try {
      const allOrders = await getOrders(clientId, null)
      setOrders(allOrders)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch only — WebSocket handles subsequent updates
  useEffect(() => {
    if (!clientId) return
    fetchOrders()
  }, [clientId])

  // Real-time order updates via WebSocket (replaces 15s polling)
  useSocket(clientId, {
    onNewOrder: (order) => {
      setOrders(prev => {
        if (prev.find(o => o.id === order.id)) return prev
        return [order, ...prev]
      })
      setLastUpdated(new Date())
    },
    onOrderUpdated: (order) => {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...order } : o))
      setLastUpdated(new Date())
    }
  })

  // Helper functions to get filtered orders
  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status)
  }

  const getNewOrders = () => getOrdersByStatus('new')
  const getLiveOrders = () => orders.filter(order => 
    ['new', 'accepted', 'preparing', 'ready'].includes(order.status)
  )
  const getHistoryOrders = () => orders.filter(order => 
    ['completed', 'cancelled'].includes(order.status)
  )

  const value = {
    orders,
    isLoading,
    lastUpdated,
    fetchOrders, // Manual refresh
    getOrdersByStatus,
    getNewOrders,
    getLiveOrders,
    getHistoryOrders,
    // Get orders by location
    getOrdersByLocation: (locationId) => {
      if (!locationId) return orders
      return orders.filter(order => order.locationId === locationId)
    },
    // Get today's orders
    getTodayOrders: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return orders.filter(order => {
        if (!order.createdAt) return false
        const orderDate = new Date(order.createdAt)
        orderDate.setHours(0, 0, 0, 0)
        return orderDate.getTime() === today.getTime()
      })
    }
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}
