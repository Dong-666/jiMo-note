import { create } from 'zustand'

type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => void
}

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem('jimo-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'system'
}

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(mode: ThemeMode) {
  const isDark = mode === 'dark' || (mode === 'system' && getSystemDark())
  document.documentElement.classList.toggle('dark', isDark)
  return isDark
}

let mediaQuery: MediaQueryList | null = null
let mediaListener: (() => void) | null = null

function listenSystem(setIsDark: (v: boolean) => void) {
  if (mediaListener) return
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaListener = () => {
    const mode = getStoredMode()
    if (mode === 'system') {
      const dark = getSystemDark()
      document.documentElement.classList.toggle('dark', dark)
      setIsDark(dark)
    }
  }
  mediaQuery.addEventListener('change', mediaListener)
}

export const useThemeStore = create<ThemeState>((set) => {
  const initialMode = getStoredMode()
  const initialIsDark = applyTheme(initialMode)

  if (initialMode === 'system') {
    listenSystem((isDark) => set({ isDark }))
  }

  return {
    mode: initialMode,
    isDark: initialIsDark,
    setMode: (mode) => {
      try {
        localStorage.setItem('jimo-theme', mode === 'system' ? '' : mode)
      } catch {}
      const isDark = applyTheme(mode)
      if (mode === 'system') {
        listenSystem((v) => set({ isDark: v }))
      }
      set({ mode, isDark })
    },
  }
})
