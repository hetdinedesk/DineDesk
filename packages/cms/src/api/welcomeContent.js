import api from './client'

export const getWelcomeContent = (clientId) =>
  api.get(`/clients/${clientId}/welcome-content`).then(r => r.data)

export const updateWelcomeContent = (clientId, data) =>
  api.put(`/clients/${clientId}/welcome-content`, data).then(r => r.data)
