import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggle: () => void
}

function getInitialTheme(): boolean {
  try {
    const stored = localStorage.getItem('jimo-theme')
    if (stored !== null) return stored === 'dark'
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: getInitialTheme(),
  toggle: () =>
    set((state) => {
      const next = !state.isDark
      try {
        localStorage.setItem('jimo-theme', next ? 'dark' : 'light')
      } catch {}
      document.documentElement.classList.toggle('dark', next)
      return { isDark: next }
    }),
}))
