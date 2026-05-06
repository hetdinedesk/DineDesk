import api from './client'

export const getOrders = (clientId, status, locationId) => {
  let params = new URLSearchParams()
  if (status) params.append('status', status)
  if (locationId) params.append('locationId', locationId)
  const queryString = params.toString()
  return api.get(`/clients/${clientId}/orders${queryString ? `?${queryString}` : ''}`).then(r => r.data)
}

export const getOrder = (orderId) =>
  api.get(`/orders/${orderId}`).then(r => r.data)

export const updateOrderStatus = (clientId, orderId, status) =>
  api.patch(`/clients/${clientId}/orders/${orderId}/status`, { status }).then(r => r.data)
