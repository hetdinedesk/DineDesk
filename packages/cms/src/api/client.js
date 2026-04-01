import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
console.log('[API Client] Base URL:', baseURL)

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
      } else if (err.response.status === 404 && err.config.url.includes('/clients/')) {
        // If a client-specific route returns 404, the client likely doesn't exist anymore
        console.warn('[API Client] Client not found, clearing active site')
        sessionStorage.removeItem('dd_active_site')
        sessionStorage.removeItem('dd_site_nav')
        // We can't easily trigger a re-render here without a global state manager,
        // but clearing the storage will fix it on the next reload or navigation.
        // For immediate effect, we can force a reload to the root.
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api