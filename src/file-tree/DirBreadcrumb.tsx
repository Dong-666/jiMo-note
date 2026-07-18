import { ChevronRight } from 'lucide-react'

interface Props {
  path: string
  owner: string
  repo: string
  onNavigate: (path: string) => void
}

export default function DirBreadcrumb({ path, owner, repo, onNavigate }: Props) {
  const parts = path ? path.split('/') : []

  return (
    <div className="flex items-center gap-1 text-sm text-ink-light dark:text-dark-text-secondary overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
      <button
        onClick={() => onNavigate('')}
        className="hover:text-ink dark:hover:text-dark-text transition-colors shrink-0 cursor-pointer"
      >
        {owner}/{repo}
      </button>
      {parts.map((part, i) => {
        const fullPath = parts.slice(0, i + 1).join('/')
        const isLast = i === parts.length - 1
        return (
          <span key={fullPath} className="flex items-center gap-1 shrink-0">
            <ChevronRight size={14} />
            {isLast ? (
              <span className="text-ink dark:text-dark-text font-medium">{part}</span>
            ) : (
              <button
                onClick={() => onNavigate(fullPath)}
                className="hover:text-ink dark:hover:text-dark-text transition-colors cursor-pointer"
              >
                {part}
              </button>
            )}
          </span>
        )
      })}
    </div>
  )
}
