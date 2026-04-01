import api from './client.js'

// Get navigation (returns { flat, tree, active })
export async function getNavigation(clientId) {
  const res = await api.get(`/clients/${clientId}/navigation`)
  return res.data
}

// Get navigation tree only (for preview)
export async function getNavigationTree(clientId) {
  const res = await api.get(`/clients/${clientId}/navigation/tree`)
  return res.data
}

// Save entire navigation structure
export async function saveNavigation(clientId, tree) {
  const res = await api.put(`/clients/${clientId}/navigation`, { tree })
  return res.data
}

// Create new navigation item
export async function createNavItem(clientId, data) {
  const res = await api.post(`/clients/${clientId}/navigation`, data)
  return res.data
}

// Update navigation item
export async function updateNavItem(clientId, id, data) {
  const res = await api.patch(`/clients/${clientId}/navigation/${id}`, data)
  return res.data
}

// Delete navigation item
export async function deleteNavItem(clientId, id) {
  const res = await api.delete(`/clients/${clientId}/navigation/${id}`)
  return res.data
}

// Reorder items
export async function reorderNavItems(clientId, items) {
  const res = await api.put(`/clients/${clientId}/navigation/reorder`, { items })
  return res.data
}
