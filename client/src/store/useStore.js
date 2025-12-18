import { create } from 'zustand'
import { api } from '../api'

export const useStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  modal: null,
  authTab: 'login',
  language: localStorage.getItem('language') || 'en',

  setModal: (modal) => set({ modal }),
  setAuthTab: (tab) => set({ authTab: tab }),
  
  setLanguage: async (lang) => {
    localStorage.setItem('language', lang)
    set({ language: lang })
    const { user } = get()
    if (user) {
      try {
        await api.updateSettings({ language: lang })
      } catch (err) {
        console.error(err)
      }
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const user = await api.getMe()
        set({ user, token, language: user.language || 'en' })
        localStorage.setItem('language', user.language || 'en')
      } catch {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      }
    }
  },

  login: async (data) => {
    const res = await api.login(data)
    localStorage.setItem('token', res.token)
    localStorage.setItem('language', res.user.language || 'en')
    set({ user: res.user, token: res.token, modal: null, language: res.user.language || 'en' })
  },

  register: async (data) => {
    const res = await api.register(data)
    localStorage.setItem('token', res.token)
    localStorage.setItem('language', res.user.language || 'en')
    set({ user: res.user, token: res.token, modal: null, language: res.user.language || 'en' })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  updateUser: (user) => set({ user })
}))
