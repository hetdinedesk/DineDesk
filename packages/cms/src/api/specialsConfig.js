import api from './client'

export const getSpecialsConfig = (clientId) =>
  api.get(`/clients/${clientId}/specials-config`).then(r => r.data)

export const updateSpecialsConfig = (clientId, data) =>
  api.put(`/clients/${clientId}/specials-config`, data).then(r => r.data)
