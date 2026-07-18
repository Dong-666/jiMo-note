import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, FileText } from 'lucide-react'
import { useAuthStore } from '../stores/auth-store'
import { gitService } from '../services/git-service'
import MilkdownEditor from '../editor/MilkdownEditor'
import FormatToolbar from '../editor/FormatToolbar'
import { addRecentFile } from '../file-tree/RecentFiles'
import type { EditorRef } from '../editor/MilkdownEditor'

type SaveState = 'idle' | 'saving' | 'success' | 'error'

export default function EditorPage() {
  const navigate = useNavigate()
  const { owner = '', name = '', '*': filePath = '' } = useParams()
  const { isVerified } = useAuthStore()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [editorKey, setEditorKey] = useState(0)
  const editorRef = useRef<EditorRef | null>(null)

  useEffect(() => {
    if (!isVerified) {
      navigate('/login', { replace: true })
      return
    }
    loadFile()
  }, [filePath])

  const loadFile = async () => {
    setLoading(true)
    try {
      await gitService.configure(owner, name)
      const file = await gitService.getFile(filePath)
      setContent(file.content)
      addRecentFile(filePath)
    } catch (e) {
      setContent('# 加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaveState('saving')
    setErrorMsg('')
    try {
      await gitService.configure(owner, name)
      const file = await gitService.getFile(filePath)
      const md = editorRef.current?.getMarkdown() ?? ''
      await gitService.saveFile(filePath, md, file.sha, `Update ${filePath}`)
      addRecentFile(filePath)
      setSaveState('success')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存失败'
      if (msg.includes('409') || msg.includes('conflict')) {
        setErrorMsg('文件已被修改，覆盖保存或取消')
      } else {
        setErrorMsg(msg)
      }
      setSaveState('error')
    }
  }

  const handleDiscard = async () => {
    setSaveState('idle')
    setLoading(true)
    try {
      await gitService.configure(owner, name)
      const file = await gitService.getFile(filePath)
      setContent(file.content)
      setEditorKey(k => k + 1)
    } finally {
      setLoading(false)
    }
  }

  const fileName = filePath.split('/').pop() || ''

  return (
    <div className="flex flex-col h-dvh dark:bg-dark-bg">
      <header className="ink-header-bar">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-1 text-ink-muted dark:text-dark-text-secondary hover:text-ink dark:hover:text-dark-text rounded-md
                       hover:bg-paper-border/50 dark:hover:bg-dark-border/50 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-ink-muted dark:text-dark-text-secondary shrink-0" />
            <h1 className="text-sm font-medium text-ink dark:text-dark-text truncate">
              {fileName}
            </h1>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === 'saving' || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                     text-seal hover:bg-seal/5 disabled:opacity-50
                     transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
        >
          {saveState === 'saving' ? (
            <span className="w-4 h-4 border-2 border-seal/30 border-t-seal rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saveState === 'saving' ? '保存中' : '保存'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto bg-paper dark:bg-dark-bg">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-ink-muted/30 dark:border-dark-text-secondary/30 border-t-ink-muted dark:border-t-dark-text-secondary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="min-h-full">
            <MilkdownEditor
              key={`${filePath}-${editorKey}`}
              content={content}
              editorRef={editorRef}
            />
          </div>
        )}
      </div>

      {saveState === 'success' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-ink dark:bg-dark-text text-paper dark:text-dark-bg text-sm rounded-lg shadow-lg">
          已保存
        </div>
      )}

      {saveState === 'error' && errorMsg && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-seal text-white text-sm rounded-lg shadow-lg max-w-xs text-center">
          {errorMsg}
          <div className="flex gap-2 mt-2 justify-center">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors cursor-pointer"
            >
              覆盖保存
            </button>
            <button
              onClick={handleDiscard}
              className="px-3 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors cursor-pointer"
            >
              放弃修改
            </button>
            <button
              onClick={() => setSaveState('idle')}
              className="px-3 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <FormatToolbar editorRef={editorRef} />
    </div>
  )
}
