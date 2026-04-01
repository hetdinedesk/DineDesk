import api from './client'

export const getHomeSections = (clientId) =>
  api.get(`/clients/${clientId}/homepage`).then(r => r.data)

export const createHomeSection = (clientId, data) =>
  api.post(`/clients/${clientId}/homepage`, data).then(r => r.data)

export const updateHomeSection = (clientId, id, data) =>
  api.put(`/clients/${clientId}/homepage/${id}`, data).then(r => r.data)

export const deleteHomeSection = (clientId, id) =>
  api.delete(`/clients/${clientId}/homepage/${id}`).then(r => r.data)

// Bulk save - delete all + create new (matches backend PUT /homepage)
export const saveHomeSections = (clientId, sections) =>
  api.put(`/clients/${clientId}/homepage`, sections).then(r => r.data)

