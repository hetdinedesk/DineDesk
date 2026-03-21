import { create } from 'zustand'
import api from '../api/client'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('dd_token'),

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('dd_token', res.data.token)
    set({ user: res.data.user, token: res.data.token })
    return res.data.user
  },

  logout: () => {
    localStorage.removeItem('dd_token')
    set({ user: null, token: null })
    window.location.href = '/login'
  },

  loadUser: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data })
    } catch (e) {
      localStorage.removeItem('dd_token')
      set({ user: null, token: null })
    }
  }
}))