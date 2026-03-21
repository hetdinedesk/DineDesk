import api from './client'

export const getMenuCategories = (clientId) =>
  api.get(`/clients/${clientId}/menu-categories`).then(r => r.data)

export const getMenuItems = (clientId) =>
  api.get(`/clients/${clientId}/menu-items`).then(r => r.data)

export const createMenuItem = (clientId, data) =>
  api.post(`/clients/${clientId}/menu-items`, data).then(r => r.data)

export const updateMenuItem = (clientId, id, data) =>
  api.put(`/clients/${clientId}/menu-items/${id}`, data).then(r => r.data)

export const deleteMenuItem = (clientId, id) =>
  api.delete(`/clients/${clientId}/menu-items/${id}`).then(r => r.data)

export const reorderMenuItems = (clientId, items) =>
  api.put(`/clients/${clientId}/menu-items/reorder`, { items }).then(r => r.data)