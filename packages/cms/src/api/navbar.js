import api from './client'

export const getNavbar = (clientId) =>
  api.get(`/clients/${clientId}/navbar`).then(r => r.data)

export const saveNavbar = (clientId, data) =>
  api.put(`/clients/${clientId}/navbar`, data).then(r => r.data)

export const getNavigationTree = (clientId) =>
  api.get(`/clients/${clientId}/navbar/tree`).then(r => r.data)
