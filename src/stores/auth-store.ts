import { create } from 'zustand'
import { loadToken, saveToken, saveRepoConfig, verifyToken, verifyRepo, clearAuth, getStoredOwner, getStoredRepo } from '../services/auth-service'

interface AuthState {
  token: string | null
  owner: string
  repo: string
  username: string
  isVerified: boolean
  restoring: boolean
  loading: boolean
  error: string

  login: (token: string) => Promise<boolean>
  configureRepo: (owner: string, repo: string) => Promise<boolean>
  logout: () => void
  restoreSession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  owner: '',
  repo: '',
  username: '',
  isVerified: false,
  restoring: true,
  loading: false,
  error: '',

  login: async (token) => {
    set({ loading: true, error: '' })
    const user = await verifyToken(token)
    if (!user) {
      set({ loading: false, error: 'Token 无效，请检查后重试' })
      return false
    }
    await saveToken(token)
    set({
      token,
      username: user.login,
      loading: false,
      isVerified: true,
    })
    return true
  },

  configureRepo: async (owner, repo) => {
    const { token } = get()
    if (!token) {
      set({ error: '请先验证 Token' })
      return false
    }
    set({ loading: true, error: '' })
    const ok = await verifyRepo(token, owner, repo)
    if (!ok) {
      set({ loading: false, error: '仓库不存在或无访问权限' })
      return false
    }
    saveRepoConfig(owner, repo)
    set({ owner, repo, loading: false })
    return true
  },

  logout: () => {
    clearAuth()
    set({
      token: null,
      owner: '',
      repo: '',
      username: '',
      isVerified: false,
      error: '',
    })
  },

  restoreSession: async () => {
    set({ restoring: true })
    try {
      const storedOwner = getStoredOwner()
      const storedRepo = getStoredRepo()
      if (!storedOwner || !storedRepo) {
        set({ restoring: false })
        return false
      }

      const token = await loadToken()
      if (!token) {
        set({ restoring: false })
        return false
      }

      const user = await verifyToken(token)
      if (!user) {
        set({ restoring: false })
        return false
      }

      set({
        token,
        owner: storedOwner,
        repo: storedRepo,
        username: user.login,
        isVerified: true,
        restoring: false,
      })
      return true
    } catch {
      set({ restoring: false })
      return false
    }
  },
}))
