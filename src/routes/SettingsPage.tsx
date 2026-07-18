import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, Key, Github, Moon, Sun } from 'lucide-react'
import { useAuthStore } from '../stores/auth-store'
import { useThemeStore } from '../stores/theme-store'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { username, owner, repo, token, logout } = useAuthStore()
  const { isDark, toggle } = useThemeStore()

  const maskedToken = token
    ? token.slice(0, 8) + '••••••••' + token.slice(-4)
    : ''

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="ink-header-bar">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-ink-muted dark:text-dark-text-secondary hover:text-ink dark:hover:text-dark-text rounded-md
                     hover:bg-paper-border/50 dark:hover:bg-dark-border/50 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-medium text-ink dark:text-dark-text">设置</h1>
        <div className="w-8" />
      </header>

      <div className="flex-1 p-4 space-y-6">
        <section>
          <h2 className="text-xs font-medium text-ink-muted dark:text-dark-text-secondary uppercase tracking-wider mb-3">账户</h2>
          <div className="ink-card p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ink/5 dark:bg-dark-text/10 flex items-center justify-center">
                <Github size={20} className="text-ink dark:text-dark-text" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink dark:text-dark-text">{username}</p>
                <p className="text-xs text-ink-muted dark:text-dark-text-secondary">{owner}/{repo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-muted dark:text-dark-text-secondary">
              <Key size={14} />
              <span className="font-mono">{maskedToken}</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium text-ink-muted dark:text-dark-text-secondary uppercase tracking-wider mb-3">外观</h2>
          <div className="ink-card overflow-hidden">
            <button
              onClick={toggle}
              className="w-full flex items-center gap-3 px-4 py-3 text-left
                         text-ink dark:text-dark-text hover:bg-paper-border/30 dark:hover:bg-dark-border/30
                         transition-colors cursor-pointer"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-sm font-medium">
                {isDark ? '浅色模式' : '深色模式'}
              </span>
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium text-ink-muted dark:text-dark-text-secondary uppercase tracking-wider mb-3">操作</h2>
          <div className="ink-card overflow-hidden">
            <button
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left
                         text-seal hover:bg-seal/5 transition-colors
                         cursor-pointer"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">退出登录</span>
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium text-ink-muted dark:text-dark-text-secondary uppercase tracking-wider mb-3">关于</h2>
          <div className="ink-card p-4">
            <p className="font-serif text-lg font-bold tracking-widest text-ink dark:text-dark-text">极墨</p>
            <p className="text-xs text-ink-muted dark:text-dark-text-secondary mt-1">v0.0.1</p>
            <p className="text-xs text-ink-muted dark:text-dark-text-secondary mt-2 leading-relaxed">
              移动端 Markdown 编辑器，以 GitHub 仓库为存储后端。
              <br />
              电脑用 Typora + 手机用极墨，无缝衔接。
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
