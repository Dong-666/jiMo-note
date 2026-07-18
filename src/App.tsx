import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './routes/LoginPage'
import FileTreePage from './routes/FileTreePage'
import EditorPage from './routes/EditorPage'
import SettingsPage from './routes/SettingsPage'
import { useAuthStore } from './stores/auth-store'
import { useThemeStore } from './stores/theme-store'

function RootRedirect() {
  const { isVerified, owner, repo } = useAuthStore()
  if (isVerified && owner && repo) {
    return <Navigate to={`/repo/${owner}/${repo}`} replace />
  }
  return <Navigate to="/login" replace />
}

export default function App() {
  const isDark = useThemeStore((s) => s.isDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/repo/:owner/:name/*" element={<FileTreePage />} />
        <Route path="/edit/:owner/:name/*" element={<EditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}
