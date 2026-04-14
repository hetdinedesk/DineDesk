import api from './client'

export const getFeaturedConfig = (clientId) =>
  api.get(`/clients/${clientId}/featured-config`).then(r => r.data)

export const updateFeaturedConfig = (clientId, data) =>
  api.put(`/clients/${clientId}/featured-config`, data).then(r => r.data)
