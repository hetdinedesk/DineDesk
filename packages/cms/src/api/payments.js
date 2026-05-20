import api from './client'

export const getPayments = (clientId) =>
  api.get(`/clients/${clientId}/payments`).then(r => r.data)

export const savePayments = (clientId, data) =>
  api.put(`/clients/${clientId}/payments`, data).then(r => r.data)

export const getStripeConnectStatus = (clientId) =>
  api.get(`/clients/${clientId}/connect/status`).then(r => r.data)

export const createStripeConnectLink = (clientId) =>
  api.post(`/clients/${clientId}/connect/create-link`).then(r => r.data)

export const createStripeLoginLink = (clientId) =>
  api.post(`/clients/${clientId}/connect/create-login-link`).then(r => r.data)

export const disconnectStripe = (clientId) =>
  api.delete(`/clients/${clientId}/connect/disconnect`).then(r => r.data)
