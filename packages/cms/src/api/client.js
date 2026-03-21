import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
})

// Attach the login token to every request automatically
api.interceptors.request.use(function(config) {
  const token = localStorage.getItem('dd_token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

// If token expires, send user to login page automatically
api.interceptors.response.use(
  function(res) { return res },
  function(err) {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('dd_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api