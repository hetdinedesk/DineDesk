import api from './client'

export const getPayments = (clientId) =>
  api.get(`/clients/${clientId}/payments`).then(r => r.data)

export const savePayments = (clientId, data) =>
  api.put(`/clients/${clientId}/payments`, data).then(r => r.data)
