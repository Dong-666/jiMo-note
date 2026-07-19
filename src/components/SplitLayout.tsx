import { useEffect } from 'react'
import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth-store'
import { useFileTreeStore } from '../stores/file-tree-store'
import { gitService } from '../services/git-service'
import FileTreeSidebar from './FileTreeSidebar'

export default function SplitLayout() {
  const { owner = '', name = '' } = useParams()
  const navigate = useNavigate()
  const { isVerified } = useAuthStore()

  useEffect(() => {
    if (!isVerified) {
      navigate('/login', { replace: true })
      return
    }
    gitService.configure(owner, name)
    useFileTreeStore.getState().navigateTo('')
  }, [owner, name, isVerified])

  if (!isVerified) return null

  return (
    <div className="flex h-dvh bg-paper dark:bg-dark-bg">
      <FileTreeSidebar owner={owner} name={name} />
      <main className="flex-1 overflow-hidden max-md:max-w-full">
        <Outlet context={{ owner, name }} />
      </main>
    </div>
  )
}
