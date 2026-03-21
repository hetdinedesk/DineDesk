import api from './client'

// Trigger a Netlify rebuild for this client
export const deployClient = (clientId) =>
  api.post(`/clients/${clientId}/deploy`).then(r => r.data)

// Get deployment history from your database
export const getDeploys = (clientId) =>
  api.get(`/clients/${clientId}/deploys`).then(r => r.data)

// Create a new Netlify site for this client
export const createNetlifySite = (clientId) =>
  api.post(`/clients/${clientId}/netlify/create`).then(r => r.data)

// Get live deploy status directly from Netlify
export const getNetlifyDeploys = (clientId) =>
  api.get(`/clients/${clientId}/netlify/deploys`).then(r => r.data)