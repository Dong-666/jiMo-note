import { RefreshCw } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import DirRow from './DirRow'
import FileRow from './FileRow'
import DirBreadcrumb from './DirBreadcrumb'
import { useFileTreeStore } from '../stores/file-tree-store'

export default function FileList() {
  const navigate = useNavigate()
  const { owner = '', name = '' } = useParams()
  const { files, loading, error, currentPath, navigateTo, refresh } = useFileTreeStore()

  const handleNavigateDir = (path: string) => {
    navigateTo(path)
  }

  const handleOpenFile = (path: string) => {
    navigate(`/repo/${owner}/${name}/edit/${path}`)
  }

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw size={20} className="text-ink-muted dark:text-dark-text-secondary animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-sm text-ink-muted dark:text-dark-text-secondary">{error}</p>
        <button
          onClick={refresh}
          className="mt-3 px-4 py-1.5 text-sm text-seal hover:text-seal-hover
                     border border-paper-border dark:border-dark-border rounded-lg hover:bg-paper-card dark:hover:bg-dark-card
                     transition-colors cursor-pointer"
        >
          重试
        </button>
      </div>
    )
  }

  const dirs = files.filter(f => f.type === 'dir')
  const fileItems = files.filter(f => f.type === 'file')

  return (
    <div>
      <div className="px-4 pt-3 pb-2">
        <DirBreadcrumb
          path={currentPath}
          owner={owner}
          repo={name}
          onNavigate={handleNavigateDir}
        />
      </div>

      {files.length === 0 ? (
        <p className="text-center text-sm text-ink-muted dark:text-dark-text-secondary py-16">空目录</p>
      ) : (
        <div>
          {dirs.map(dir => (
            <DirRow key={dir.path} dir={dir} onNavigate={handleNavigateDir} />
          ))}
          {fileItems.map(f => (
            <FileRow key={f.path} file={f} onOpen={handleOpenFile} />
          ))}
        </div>
      )}
    </div>
  )
}
