import api from './client'

export const getPages = (clientId) =>
  api.get(`/clients/${clientId}/pages`).then(r => r.data)

export const createPage = (clientId, data) =>
  api.post(`/clients/${clientId}/pages`, data).then(r => r.data)

export const updatePage = (clientId, id, data) =>
  api.put(`/clients/${clientId}/pages/${id}`, data).then(r => r.data)

export const deletePage = (clientId, id) =>
  api.delete(`/clients/${clientId}/pages/${id}`).then(r => r.data)