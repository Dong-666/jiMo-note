import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Settings, Plus } from 'lucide-react'
import { useAuthStore } from '../stores/auth-store'
import { useFileTreeStore } from '../stores/file-tree-store'
import { gitService } from '../services/git-service'
import FileList from '../file-tree/FileList'
import RecentFiles from '../file-tree/RecentFiles'

export default function FileTreePage() {
  const navigate = useNavigate()
  const { owner = '', name = '' } = useParams()
  const { isVerified, username } = useAuthStore()

  useEffect(() => {
    if (!isVerified) {
      navigate('/login', { replace: true })
      return
    }
    gitService.configure(owner, name)
    useFileTreeStore.getState().navigateTo('')
  }, [owner, name, isVerified])

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="ink-header-bar">
        <div>
          <h1 className="text-sm font-medium text-ink dark:text-dark-text">
            {owner}/{name}
          </h1>
          <p className="text-xs text-ink-muted dark:text-dark-text-secondary mt-0.5">{username}</p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 text-ink-muted dark:text-dark-text-secondary hover:text-ink dark:hover:text-dark-text transition-colors rounded-md
                     hover:bg-paper-border/50 dark:hover:bg-dark-border/50 cursor-pointer"
        >
          <Settings size={18} />
        </button>
      </header>

      <RecentFiles />

      <div className="flex-1 overflow-y-auto">
        <FileList />
      </div>

      <div className="fixed bottom-6 right-6 max-w-lg mx-auto" style={{ left: '50%', transform: 'translateX(-50%)' }}>
        <button
          onClick={() => {
            const name = prompt('文件名（.md）')
            if (name) {
              const store = useFileTreeStore.getState()
              const path = store.currentPath
                ? `${store.currentPath}/${name.endsWith('.md') ? name : name + '.md'}`
                : name.endsWith('.md') ? name : name + '.md'
              store.createFile(path)
            }
          }}
          className="w-12 h-12 bg-seal text-white rounded-full flex items-center justify-center
                     shadow-lg hover:bg-seal-hover active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}
