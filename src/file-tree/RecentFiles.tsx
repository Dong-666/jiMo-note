import { useState, useEffect } from 'react'
import { Clock, FileText } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { STORAGE_KEYS } from '../lib/config'

interface RecentFile {
  path: string
  name: string
  timestamp: number
}

export function getRecentFiles(): RecentFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_FILES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addRecentFile(path: string) {
  const files = getRecentFiles().filter(f => f.path !== path)
  files.unshift({
    path,
    name: path.split('/').pop() || path,
    timestamp: Date.now(),
  })
  localStorage.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify(files.slice(0, 5)))
}

export default function RecentFiles() {
  const navigate = useNavigate()
  const { owner = '', name = '' } = useParams()
  const [files, setFiles] = useState<RecentFile[]>([])

  useEffect(() => {
    setFiles(getRecentFiles())
  }, [])

  if (files.length === 0) return null

  return (
    <div className="border-b border-paper-border dark:border-dark-border">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
        <Clock size={14} className="text-ink-muted dark:text-dark-text-secondary" />
        <span className="text-xs font-medium text-ink-muted dark:text-dark-text-secondary">最近编辑</span>
      </div>
      <div className="pb-1">
        {files.map(file => (
          <button
            key={file.path}
            onClick={() => navigate(`/repo/${owner}/${name}/edit/${file.path}`)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                       hover:bg-paper-card dark:hover:bg-dark-card transition-colors duration-150 cursor-pointer"
          >
            <FileText size={16} className="text-ink-muted dark:text-dark-text-secondary shrink-0" />
            <span className="text-sm text-ink dark:text-dark-text truncate flex-1">{file.name}</span>
            <span className="text-xs text-ink-muted dark:text-dark-text-secondary shrink-0">
              {formatTime(file.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${Math.floor(diff / 86400000)} 天前`
}
