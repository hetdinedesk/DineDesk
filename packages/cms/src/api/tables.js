import api from './client'

export const getTables = (clientId, locationId) =>
  api.get(`/clients/${clientId}/locations/${locationId}/tables`).then(r => r.data)

export const createTable = (clientId, locationId, data) =>
  api.post(`/clients/${clientId}/locations/${locationId}/tables`, data).then(r => r.data)

export const updateTable = (clientId, locationId, tableId, data) =>
  api.patch(`/clients/${clientId}/locations/${locationId}/tables/${tableId}`, data).then(r => r.data)

export const deleteTable = (clientId, locationId, tableId) =>
  api.delete(`/clients/${clientId}/locations/${locationId}/tables/${tableId}`).then(r => r.data)

export const generateQRCode = (clientId, locationId, tableId) =>
  api.post(`/clients/${clientId}/locations/${locationId}/tables/${tableId}/qrcode`).then(r => r.data)
