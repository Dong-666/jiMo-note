import type { ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../stores/theme-store'

export default function Layout({ children }: { children: ReactNode }) {
  const { isDark, toggle } = useThemeStore()

  return (
    <div className="min-h-dvh max-w-sm mx-auto bg-paper dark:bg-dark-bg transition-colors duration-200">
      {children}
      <button
        onClick={toggle}
        className="fixed bottom-4 right-4 z-50 w-9 h-9 rounded-full flex items-center
                   justify-center bg-paper-card dark:bg-dark-card border border-paper-border
                   dark:border-dark-border shadow-md text-ink-muted dark:text-dark-muted
                   hover:text-ink dark:hover:text-dark-text transition-colors cursor-pointer"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  )
}
