import api from './client'

export const getAnalytics = (clientId, period) =>
  api.get(`/clients/${clientId}/analytics?period=${period}`).then(r => r.data)