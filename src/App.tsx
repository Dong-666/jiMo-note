import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import Layout from './components/Layout'
import SplitLayout from './components/SplitLayout'
import LoginPage from './routes/LoginPage'
import FileTreePage from './routes/FileTreePage'
import EditorPage from './routes/EditorPage'
import SettingsPage from './routes/SettingsPage'
import { useAuthStore } from './stores/auth-store'
import { useThemeStore } from './stores/theme-store'

function RootRedirect() {
  const { isVerified, owner, repo, restoring } = useAuthStore()
  if (restoring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-paper dark:bg-dark-bg">
        <RefreshCw size={24} className="animate-spin text-ink-muted dark:text-dark-text-secondary" />
      </div>
    )
  }
  if (isVerified && owner && repo) {
    return <Navigate to={`/repo/${owner}/${repo}`} replace />
  }
  return <Navigate to="/login" replace />
}

export default function App() {
  const isDark = useThemeStore((s) => s.isDark)
  const restoreSession = useAuthStore((s) => s.restoreSession)

  useEffect(() => {
    restoreSession()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/repo/:owner/:name" element={<SplitLayout />}>
          <Route index element={<FileTreePage />} />
          <Route path="edit/*" element={<EditorPage />} />
        </Route>
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}
