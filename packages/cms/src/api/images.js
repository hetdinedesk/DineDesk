import api from './client'

export const uploadImage = (clientId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/clients/${clientId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}