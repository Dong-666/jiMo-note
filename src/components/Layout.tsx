import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper dark:bg-dark-bg transition-colors duration-200">
      {children}
    </div>
  )
}
