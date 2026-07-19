import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, FileText, Folder } from 'lucide-react'
import { useAuthStore } from '../stores/auth-store'
import { useFileTreeStore } from '../stores/file-tree-store'
import FileList from '../file-tree/FileList'
import RecentFiles from '../file-tree/RecentFiles'
import Modal from './Modal'

interface Props {
  owner: string
  name: string
}

export default function FileTreeSidebar({ owner, name }: Props) {
  const navigate = useNavigate()
  const { username } = useAuthStore()
  const [modal, setModal] = useState<'folder' | 'file' | null>(null)
  const [inputValue, setInputValue] = useState('')

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-paper-border dark:md:border-dark-border bg-paper-card dark:bg-dark-card">
      <header className="ink-header-bar">
        <div className="min-w-0">
          <h1 className="text-sm font-medium text-ink dark:text-dark-text truncate">
            {owner}/{name}
          </h1>
          <p className="text-xs text-ink-muted dark:text-dark-text-secondary mt-0.5 truncate">{username}</p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 text-ink-muted dark:text-dark-text-secondary hover:text-ink dark:hover:text-dark-text transition-colors rounded-md
                     hover:bg-paper-border/50 dark:hover:bg-dark-border/50 cursor-pointer shrink-0"
        >
          <Settings size={18} />
        </button>
      </header>

      <RecentFiles />

      <div className="flex-1 overflow-y-auto">
        <FileList />
      </div>

      <div className="p-3 border-t border-paper-border dark:border-dark-border">
        <div className="flex gap-2">
          <button
            onClick={() => { setInputValue(''); setModal('file') }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm
                       text-ink-muted dark:text-dark-text-secondary hover:text-ink dark:hover:text-dark-text
                       hover:bg-paper-border/50 dark:hover:bg-dark-border/50 rounded-lg transition-colors cursor-pointer"
          >
            <FileText size={15} />
            新建文件
          </button>
          <button
            onClick={() => { setInputValue(''); setModal('folder') }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm
                       text-ink-muted dark:text-dark-text-secondary hover:text-ink dark:hover:text-dark-text
                       hover:bg-paper-border/50 dark:hover:bg-dark-border/50 rounded-lg transition-colors cursor-pointer"
          >
            <Folder size={15} />
            新建文件夹
          </button>
        </div>
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
            const fileName = inputValue.endsWith('.md') ? inputValue : inputValue + '.md'
            const path = store.currentPath ? `${store.currentPath}/${fileName}` : fileName
            store.createFile(path)
          }
          setModal(null)
        }}
        confirmDisabled={!inputValue}
      >
        <input
          autoFocus
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && inputValue) { setModal(null); const store = useFileTreeStore.getState(); const fileName = inputValue.endsWith('.md') ? inputValue : inputValue + '.md'; const path = store.currentPath ? `${store.currentPath}/${fileName}` : fileName; store.createFile(path) } }}
          placeholder="文件名"
          className="w-full px-3 py-2 text-sm bg-paper dark:bg-dark-bg border border-paper-border dark:border-dark-border rounded-lg text-ink dark:text-dark-text placeholder-ink-muted/50 dark:placeholder-dark-text-secondary/50 outline-none focus:border-seal dark:focus:border-seal-dark transition-colors"
        />
      </Modal>
    </aside>
  )
}
