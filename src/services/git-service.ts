import { Octokit } from 'octokit'
import { loadToken } from './auth-service'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  sha: string
  size?: number
}

export interface FileContent extends FileNode {
  content: string
  download_url?: string
}

export class GitHubService {
  private octokit: Octokit | null = null
  private _owner = ''
  private _repo = ''

  private async getClient(): Promise<Octokit> {
    if (this.octokit) return this.octokit
    const token = await loadToken()
    if (!token) throw new Error('Not authenticated')
    this.octokit = new Octokit({ auth: token })
    return this.octokit
  }

  async configure(owner: string, repo: string): Promise<void> {
    this._owner = owner
    this._repo = repo
    this.octokit = null
  }

  get owner() { return this._owner }
  get repo() { return this._repo }

  async getTree(path = ''): Promise<FileNode[]> {
    const client = await this.getClient()
    const { data } = await client.rest.repos.getContent({
      owner: this._owner,
      repo: this._repo,
      path,
    })
    const items = Array.isArray(data) ? data : [data]
    return items
      .filter(item => item.type === 'file' || item.type === 'dir')
      .map(item => ({
        name: item.name,
        path: item.path,
        type: item.type as 'file' | 'dir',
        sha: item.sha,
        size: 'size' in item ? item.size : undefined,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }

  async getFile(path: string): Promise<FileContent> {
    const client = await this.getClient()
    const { data } = await client.rest.repos.getContent({
      owner: this._owner,
      repo: this._repo,
      path,
    })
    if (Array.isArray(data)) throw new Error('Path is a directory')
    if (data.type !== 'file') throw new Error('Not a file')
    const content = data.content
      ? new TextDecoder().decode(
          Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0))
        )
      : ''
    return {
      name: data.name,
      path: data.path,
      type: 'file',
      sha: data.sha,
      size: data.size,
      content,
      download_url: data.download_url || undefined,
    }
  }

  async saveFile(path: string, content: string, sha: string, message = 'Update via 极墨'): Promise<void> {
    const client = await this.getClient()
    await client.rest.repos.createOrUpdateFileContents({
      owner: this._owner,
      repo: this._repo,
      path,
      message,
      content: btoa(String.fromCharCode(...new Uint8Array(new TextEncoder().encode(content)))),
      sha,
    })
  }

  async createFile(path: string, content = '', message = 'Create via 极墨'): Promise<void> {
    const client = await this.getClient()
    await client.rest.repos.createOrUpdateFileContents({
      owner: this._owner,
      repo: this._repo,
      path,
      message,
      content: btoa(String.fromCharCode(...new Uint8Array(new TextEncoder().encode(content)))),
    })
  }

  async deleteFile(path: string, sha: string, message = 'Delete via 极墨'): Promise<void> {
    const client = await this.getClient()
    await client.rest.repos.deleteFile({
      owner: this._owner,
      repo: this._repo,
      path,
      message,
      sha,
    })
  }
}

export const gitService = new GitHubService()
