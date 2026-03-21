import api from './client'

export const getSpecials = (clientId) =>
  api.get(`/clients/${clientId}/specials`).then(r => r.data)

export const createSpecial = (clientId, data) =>
  api.post(`/clients/${clientId}/specials`, data).then(r => r.data)

export const updateSpecial = (clientId, id, data) =>
  api.put(`/clients/${clientId}/specials/${id}`, data).then(r => r.data)

export const deleteSpecial = (clientId, id) =>
  api.delete(`/clients/${clientId}/specials/${id}`).then(r => r.data)