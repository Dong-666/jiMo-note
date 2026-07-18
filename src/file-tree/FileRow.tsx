import { FileText } from 'lucide-react'
import type { FileNode } from '../services/git-service'

interface Props {
  file: FileNode
  onOpen: (path: string) => void
}

export default function FileRow({ file, onOpen }: Props) {
  const isMd = file.name.endsWith('.md')

  return (
    <button
      onClick={() => isMd && onOpen(file.path)}
      disabled={!isMd}
      className="w-full flex items-center gap-3 px-4 py-3 text-left
                 hover:bg-paper-card dark:hover:bg-dark-card active:bg-paper-border/30 dark:active:bg-dark-border/30
                 transition-colors duration-150
                 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <FileText size={18} className="text-ink-muted dark:text-dark-text-secondary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink dark:text-dark-text truncate">{file.name}</p>
      </div>
      {!isMd && (
        <span className="text-xs text-ink-muted dark:text-dark-text-secondary">不支持</span>
      )}
    </button>
  )
}
