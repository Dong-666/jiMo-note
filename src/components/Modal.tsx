import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  children: React.ReactNode
  onConfirm?: () => void
  onCancel: () => void
  confirmText?: string
  confirmDisabled?: boolean
}

export default function Modal({ open, title, children, onConfirm, onCancel, confirmText = '确定', confirmDisabled }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === overlayRef.current) onCancel() }}
    >
      <div className="w-[320px] bg-paper-card dark:bg-dark-card rounded-xl shadow-xl border border-paper-border dark:border-dark-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-paper-border dark:border-dark-border">
          <h2 className="text-sm font-medium text-ink dark:text-dark-text">{title}</h2>
          <button onClick={onCancel} className="p-1 text-ink-muted dark:text-dark-text-secondary hover:text-ink dark:hover:text-dark-text rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-3">{children}</div>
        {onConfirm && (
          <div className="flex justify-end gap-2 px-4 pb-3">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded-lg text-ink-muted dark:text-dark-text-secondary hover:bg-paper-border/50 dark:hover:bg-dark-border/50 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="px-3 py-1.5 text-sm rounded-lg bg-seal text-white hover:bg-seal-hover disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
