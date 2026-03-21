import api from './client'

export const getLocations = (clientId) =>
  api.get(`/clients/${clientId}/locations`).then(r => r.data)

export const createLocation = (clientId, data) =>
  api.post(`/clients/${clientId}/locations`, data).then(r => r.data)

export const updateLocation = (clientId, id, data) =>
  api.put(`/clients/${clientId}/locations/${id}`, data).then(r => r.data)

export const deleteLocation = (clientId, id) =>
  api.delete(`/clients/${clientId}/locations/${id}`).then(r => r.data)