import api from './client'

export const getConfig = (clientId) =>
  api.get(`/clients/${clientId}/config`).then(r => r.data)

export const saveConfig = (clientId, data) =>
  api.put(`/clients/${clientId}/config`, data).then(r => r.data)

export const toggleOrdering = (clientId, enabled, locationId) =>
  api.patch(`/clients/${clientId}/config/ordering`, { enabled, locationId }).then(r => r.data)