import { create } from 'zustand'
import { gitService, type FileNode } from '../services/git-service'

interface FileTreeState {
  currentPath: string
  files: FileNode[]
  loading: boolean
  error: string

  navigateTo: (path: string) => Promise<void>
  refresh: () => Promise<void>
  createFile: (path: string) => Promise<void>
}

export const useFileTreeStore = create<FileTreeState>((set, get) => ({
  currentPath: '',
  files: [],
  loading: false,
  error: '',

  navigateTo: async (path) => {
    set({ loading: true, error: '', currentPath: path })
    try {
      const files = await gitService.getTree(path)
      set({ files, loading: false })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : '加载失败',
      })
    }
  },

  refresh: async () => {
    const { currentPath } = get()
    set({ loading: true, error: '' })
    try {
      const files = await gitService.getTree(currentPath)
      set({ files, loading: false })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : '刷新失败',
      })
    }
  },

  createFile: async (path) => {
    try {
      await gitService.createFile(path, `# ${path.split('/').pop()?.replace('.md', '') || 'new'}\n`)
      await get().refresh()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '创建失败' })
    }
  },
}))
