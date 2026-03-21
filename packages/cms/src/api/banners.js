import api from './client'

export const getBanners = (clientId) =>
  api.get(`/clients/${clientId}/banners`).then(r => r.data)

export const createBanner = (clientId, data) =>
  api.post(`/clients/${clientId}/banners`, data).then(r => r.data)

export const updateBanner = (clientId, id, data) =>
  api.put(`/clients/${clientId}/banners/${id}`, data).then(r => r.data)

export const deleteBanner = (clientId, id) =>
  api.delete(`/clients/${clientId}/banners/${id}`).then(r => r.data)