import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Key, Github, ChevronRight, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../stores/auth-store'

export default function LoginPage() {
  const navigate = useNavigate()
  const { owner, repo, isVerified, loading, error, login, configureRepo, restoreSession } = useAuthStore()

  const [tokenInput, setTokenInput] = useState('')
  const [ownerInput, setOwnerInput] = useState('')
  const [repoInput, setRepoInput] = useState('')
  const [step, setStep] = useState<'token' | 'repo'>('token')

  useEffect(() => {
    restoreSession().then(ok => {
      if (ok) navigate(`/repo/${getStoredOwner()}/${getStoredRepo()}`, { replace: true })
    })
  }, [])

  useEffect(() => {
    if (isVerified && owner && repo) {
      navigate(`/repo/${owner}/${repo}`, { replace: true })
    }
  }, [isVerified, owner, repo])

  const handleVerifyToken = async () => {
    const ok = await login(tokenInput.trim())
    if (ok) setStep('repo')
  }

  const handleConfigureRepo = async () => {
    await configureRepo(ownerInput.trim(), repoInput.trim())
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-paper-card dark:bg-dark-card border border-paper-border dark:border-dark-border flex items-center justify-center mb-4">
          <span className="font-serif text-2xl font-bold text-ink dark:text-dark-text">墨</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-[0.2em] text-ink dark:text-dark-text">
          极墨
        </h1>
        <p className="mt-2 text-sm text-ink-muted dark:text-dark-text-secondary">移动端 Markdown 编辑器</p>
      </div>

      <div className="ink-card p-5">
        {step === 'token' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink dark:text-dark-text">
              <Github size={18} />
              <span className="text-sm font-medium">GitHub Token</span>
            </div>
            <p className="text-xs text-ink-muted dark:text-dark-text-secondary leading-relaxed">
              使用 Fine-grained PAT，需要 <b>Contents</b> 读写权限
            </p>
            <input
              type="password"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="github_pat_xxxxxxxxxxxx"
              className="w-full px-3 py-2.5 text-sm bg-paper dark:bg-dark-card border border-paper-border dark:border-dark-border rounded-lg
                         text-ink dark:text-dark-text placeholder-ink-muted/50 dark:placeholder-dark-text-secondary/30
                         focus:outline-none focus:ring-2 focus:ring-seal/30 focus:border-seal
                         transition-colors duration-150"
              autoFocus
            />
            {error && <p className="text-xs text-seal">{error}</p>}
            <button
              onClick={handleVerifyToken}
              disabled={loading || !tokenInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                         bg-seal text-white text-sm font-medium rounded-lg
                         hover:bg-seal-hover disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150 cursor-pointer"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <ChevronRight size={16} />
              )}
              {loading ? '验证中...' : '验证并继续'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink dark:text-dark-text">
              <Key size={18} />
              <span className="text-sm font-medium">仓库配置</span>
            </div>
            <p className="text-xs text-ink-muted dark:text-dark-text-secondary">
              选择要连接的 GitHub 仓库
            </p>
            <input
              type="text"
              value={ownerInput}
              onChange={e => setOwnerInput(e.target.value)}
              placeholder="owner（用户名或组织）"
              className="w-full px-3 py-2.5 text-sm bg-paper dark:bg-dark-card border border-paper-border dark:border-dark-border rounded-lg
                         text-ink dark:text-dark-text placeholder-ink-muted/50 dark:placeholder-dark-text-secondary/30
                         focus:outline-none focus:ring-2 focus:ring-seal/30 focus:border-seal
                         transition-colors duration-150"
              autoFocus
            />
            <input
              type="text"
              value={repoInput}
              onChange={e => setRepoInput(e.target.value)}
              placeholder="repo（仓库名称）"
              className="w-full px-3 py-2.5 text-sm bg-paper dark:bg-dark-card border border-paper-border dark:border-dark-border rounded-lg
                         text-ink dark:text-dark-text placeholder-ink-muted/50 dark:placeholder-dark-text-secondary/30
                         focus:outline-none focus:ring-2 focus:ring-seal/30 focus:border-seal
                         transition-colors duration-150"
            />
            {error && <p className="text-xs text-seal">{error}</p>}
            <button
              onClick={handleConfigureRepo}
              disabled={loading || !ownerInput.trim() || !repoInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                         bg-seal text-white text-sm font-medium rounded-lg
                         hover:bg-seal-hover disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150 cursor-pointer"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <ChevronRight size={16} />
              )}
              {loading ? '验证中...' : '进入仓库'}
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-ink-muted dark:text-dark-text-secondary text-center">
        Token 将加密存储在本地，不会上传到第三方
      </p>
    </div>
  )
}

function getStoredOwner() {
  return localStorage.getItem('jimo_owner') || ''
}

function getStoredRepo() {
  return localStorage.getItem('jimo_repo') || ''
}
