import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: baseURL
})

// Attach the login token to every request automatically
api.interceptors.request.use(function(config) {
  const token = localStorage.getItem('dd_token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

// Handle common error statuses
api.interceptors.response.use(
  function(res) { return res },
  function(err) {
    if (err.response) {
      if (err.response.status === 401) {
        localStorage.removeItem('dd_token')
        window.location.href = '/login'
      }
      // Note: 404 errors are handled by individual components/pages.
      // Do NOT clear session or redirect here — it causes redirect loops.
    }
    return Promise.reject(err)
  }
)

export default api