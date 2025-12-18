import { create } from 'zustand'
import { api } from '../api'

export const useStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  modal: null,
  authTab: 'login',

  setModal: (modal) => set({ modal }),
  setAuthTab: (tab) => set({ authTab: tab }),

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const user = await api.getMe()
        set({ user, token })
      } catch {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      }
    }
  },

  login: async (data) => {
    const res = await api.login(data)
    localStorage.setItem('token', res.token)
    set({ user: res.user, token: res.token, modal: null })
  },

  register: async (data) => {
    const res = await api.register(data)
    localStorage.setItem('token', res.token)
    set({ user: res.user, token: res.token, modal: null })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  updateUser: (user) => set({ user })
}))
