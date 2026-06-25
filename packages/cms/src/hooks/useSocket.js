import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Singleton socket — one connection shared across all components
let socketInstance = null

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(API_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })
  }
  return socketInstance
}

/**
 * useSocket — subscribe to real-time order events for a clientId.
 * Joins the client room on mount, leaves on unmount.
 *
 * @param {string} clientId
 * @param {{ onNewOrder?: fn, onOrderUpdated?: fn }} handlers
 */
export function useSocket(clientId, handlers = {}) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!clientId) return

    const socket = getSocket()

    socket.emit('join-client', clientId)

    const onNewOrder = (order) => {
      handlersRef.current.onNewOrder?.(order)
    }
    const onOrderUpdated = (order) => {
      handlersRef.current.onOrderUpdated?.(order)
    }

    socket.on('order:new', onNewOrder)
    socket.on('order:updated', onOrderUpdated)

    return () => {
      socket.off('order:new', onNewOrder)
      socket.off('order:updated', onOrderUpdated)
      socket.emit('leave-client', clientId)
    }
  }, [clientId])
}
