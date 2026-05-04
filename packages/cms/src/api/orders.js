import api from './client'

export const getOrders = (clientId, status) =>
  api.get(`/clients/${clientId}/orders${status ? `?status=${status}` : ''}`).then(r => r.data)

export const getOrder = (orderId) =>
  api.get(`/orders/${orderId}`).then(r => r.data)

export const updateOrderStatus = (clientId, orderId, status) =>
  api.patch(`/clients/${clientId}/orders/${orderId}/status`, { status }).then(r => r.data)
