import api from './client'

const base = (clientId) => `/clients/${clientId}/pos`

export const getPOSConfig = (clientId) =>
  api.get(base(clientId)).then(r => r.data)

export const setPOSType = (clientId, posType) =>
  api.post(base(clientId), { posType }).then(r => r.data)

export const saveCredentials = (clientId, data) =>
  api.post(`${base(clientId)}/save-credentials`, data).then(r => r.data)

export const testConnection = (clientId) =>
  api.post(`${base(clientId)}/test`).then(r => r.data)

export const connectPOS = (clientId) =>
  api.post(`${base(clientId)}/connect`).then(r => r.data)

export const syncMenu = (clientId) =>
  api.post(`${base(clientId)}/sync-menu`).then(r => r.data)

export const getSyncLogs = (clientId) =>
  api.get(`${base(clientId)}/sync-logs`).then(r => r.data)

export const getPOSHealth = (clientId) =>
  api.get(`${base(clientId)}/health`).then(r => r.data)

export const disconnectPOS = (clientId) =>
  api.delete(base(clientId)).then(r => r.data)

export const squareOAuthCallback = (clientId, code) =>
  api.post(`${base(clientId)}/oauth/square/callback`, { code }).then(r => r.data)
