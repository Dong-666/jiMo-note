import { Folder, ChevronRight } from 'lucide-react'
import type { FileNode } from '../services/git-service'

interface Props {
  dir: FileNode
  onNavigate: (path: string) => void
}

export default function DirRow({ dir, onNavigate }: Props) {
  return (
    <button
      onClick={() => onNavigate(dir.path)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left
                 hover:bg-paper-card dark:hover:bg-dark-card active:bg-paper-border/30 dark:active:bg-dark-border/30
                 transition-colors duration-150 cursor-pointer"
    >
      <Folder size={18} className="text-seal/60 shrink-0" />
      <span className="flex-1 text-sm text-ink dark:text-dark-text truncate">{dir.name}</span>
      <ChevronRight size={16} className="text-ink-muted dark:text-dark-text-secondary shrink-0" />
    </button>
  )
}
