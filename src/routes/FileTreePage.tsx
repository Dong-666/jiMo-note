import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Settings, Plus, FileText, Folder } from 'lucide-react'
import { useAuthStore } from '../stores/auth-store'
import { useFileTreeStore } from '../stores/file-tree-store'
import FileList from '../file-tree/FileList'
import RecentFiles from '../file-tree/RecentFiles'
import Modal from '../components/Modal'

export default function FileTreePage() {
  const navigate = useNavigate()
  const { owner = '', name = '' } = useParams()
  const { isVerified, username } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)
  const [modal, setModal] = useState<'folder' | 'file' | null>(null)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isVerified) {
      navigate('/login', { replace: true })
    }
  }, [isVerified])

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="ink-header-bar md:hidden">
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

      <div className="md:hidden">
        <RecentFiles />
      </div>

      <div className="flex-1 overflow-y-auto">
        <FileList />
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 md:hidden">
        {showMenu && (
          <>
            <button
              onClick={() => {
                setShowMenu(false)
                setInputValue('')
                setModal('folder')
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-paper-card dark:bg-dark-card
                         border border-paper-border dark:border-dark-border rounded-lg shadow-md
                         text-sm text-ink dark:text-dark-text
                         hover:bg-paper-border/50 dark:hover:bg-dark-border/50 transition-colors cursor-pointer"
            >
              <Folder size={16} className="text-ink-muted dark:text-dark-text-secondary" />
              新建文件夹
            </button>
            <button
              onClick={() => {
                setShowMenu(false)
                setInputValue('')
                setModal('file')
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-paper-card dark:bg-dark-card
                         border border-paper-border dark:border-dark-border rounded-lg shadow-md
                         text-sm text-ink dark:text-dark-text
                         hover:bg-paper-border/50 dark:hover:bg-dark-border/50 transition-colors cursor-pointer"
            >
              <FileText size={16} className="text-ink-muted dark:text-dark-text-secondary" />
              新建文件
            </button>
          </>
        )}
        <button
          onClick={() => setShowMenu(v => !v)}
          className="w-12 h-12 bg-seal text-white rounded-full flex items-center justify-center
                     shadow-lg hover:bg-seal-hover active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <Plus size={24} className={showMenu ? 'rotate-45' : ''} />
        </button>
      </div>

      <Modal
        open={modal === 'folder'}
        title="新建文件夹"
        onCancel={() => setModal(null)}
        onConfirm={() => {
          if (inputValue) {
            const store = useFileTreeStore.getState()
            const path = store.currentPath ? `${store.currentPath}/${inputValue}` : inputValue
            store.createDir(path)
          }
          setModal(null)
        }}
        confirmDisabled={!inputValue}
      >
        <input
          ref={inputRef}
          autoFocus
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && inputValue) { setModal(null); const store = useFileTreeStore.getState(); const path = store.currentPath ? `${store.currentPath}/${inputValue}` : inputValue; store.createDir(path) } }}
          placeholder="文件夹名"
          className="w-full px-3 py-2 text-sm bg-paper dark:bg-dark-bg border border-paper-border dark:border-dark-border rounded-lg text-ink dark:text-dark-text placeholder-ink-muted/50 dark:placeholder-dark-text-secondary/50 outline-none focus:border-seal dark:focus:border-seal-dark transition-colors"
        />
      </Modal>

      <Modal
        open={modal === 'file'}
        title="新建文件"
        onCancel={() => setModal(null)}
        onConfirm={() => {
          if (inputValue) {
            const store = useFileTreeStore.getState()
            const name = inputValue.endsWith('.md') ? inputValue : inputValue + '.md'
            const path = store.currentPath ? `${store.currentPath}/${name}` : name
            store.createFile(path)
          }
          setModal(null)
        }}
        confirmDisabled={!inputValue}
      >
        <input
          ref={inputRef}
          autoFocus
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && inputValue) { setModal(null); const store = useFileTreeStore.getState(); const name = inputValue.endsWith('.md') ? inputValue : inputValue + '.md'; const path = store.currentPath ? `${store.currentPath}/${name}` : name; store.createFile(path) } }}
          placeholder="文件名"
          className="w-full px-3 py-2 text-sm bg-paper dark:bg-dark-bg border border-paper-border dark:border-dark-border rounded-lg text-ink dark:text-dark-text placeholder-ink-muted/50 dark:placeholder-dark-text-secondary/50 outline-none focus:border-seal dark:focus:border-seal-dark transition-colors"
        />
      </Modal>
    </div>
  )
}
