import api from './client'

export const getHomeSections = (clientId) =>
  api.get(`/clients/${clientId}/homepage`).then(r => r.data)

export const createHomeSection = (clientId, data) =>
  api.post(`/clients/${clientId}/homepage`, data).then(r => r.data)

export const updateHomeSection = (clientId, id, data) =>
  api.put(`/clients/${clientId}/homepage/${id}`, data).then(r => r.data)

export const deleteHomeSection = (clientId, id) =>
  api.delete(`/clients/${clientId}/homepage/${id}`).then(r => r.data)

// Bulk save - delete all + create new (matches backend PUT /homepage)
export const saveHomeSections = (clientId, sections) =>
  api.put(`/clients/${clientId}/homepage`, sections).then(r => r.data)

// Department APIs
export const getDepartments = (clientId) =>
  api.get(`/clients/${clientId}/departments`).then(r => r.data)

export const createDepartment = (clientId, data) =>
  api.post(`/clients/${clientId}/departments`, data).then(r => r.data)

export const updateDepartment = (clientId, deptId, data) =>
  api.put(`/clients/${clientId}/departments/${deptId}`, data).then(r => r.data)

export const deleteDepartment = (clientId, deptId) =>
  api.delete(`/clients/${clientId}/departments/${deptId}`).then(r => r.data)

