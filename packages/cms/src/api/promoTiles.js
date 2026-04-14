import api from './client'

export const getPromoTiles = (clientId) =>
  api.get(`/clients/${clientId}/promo-tiles`).then(r => r.data)

export const createPromoTile = (clientId, data) =>
  api.post(`/clients/${clientId}/promo-tiles`, data).then(r => r.data)

export const updatePromoTile = (clientId, id, data) =>
  api.put(`/clients/${clientId}/promo-tiles/${id}`, data).then(r => r.data)

export const deletePromoTile = (clientId, id) =>
  api.delete(`/clients/${clientId}/promo-tiles/${id}`).then(r => r.data)

export const getPromoConfig = (clientId) =>
  api.get(`/clients/${clientId}/promo-config`).then(r => r.data)

export const updatePromoConfig = (clientId, data) =>
  api.put(`/clients/${clientId}/promo-config`, data).then(r => r.data)
