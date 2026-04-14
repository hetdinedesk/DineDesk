import api from './client'

export const getHomepageLayout = (clientId) =>
  api.get(`/clients/${clientId}/homepage-layout`).then(r => r.data)

export const updateHomepageLayout = (clientId, data) =>
  api.put(`/clients/${clientId}/homepage-layout`, data).then(r => r.data)

export const getCustomTextBlocks = (clientId) =>
  api.get(`/clients/${clientId}/custom-text-blocks`).then(r => r.data)

export const createCustomTextBlock = (clientId, data) =>
  api.post(`/clients/${clientId}/custom-text-blocks`, data).then(r => r.data)

export const updateCustomTextBlock = (clientId, blockId, data) =>
  api.put(`/clients/${clientId}/custom-text-blocks/${blockId}`, data).then(r => r.data)

export const deleteCustomTextBlock = (clientId, blockId) =>
  api.delete(`/clients/${clientId}/custom-text-blocks/${blockId}`).then(r => r.data)
