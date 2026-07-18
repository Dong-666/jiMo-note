import { Octokit } from 'octokit'
import { STORAGE_KEYS } from '../lib/config'
import { encrypt, decrypt } from '../lib/crypto'

function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ENCRYPTED_TOKEN)
}

export function getStoredOwner(): string {
  return localStorage.getItem(STORAGE_KEYS.OWNER) || ''
}

export function getStoredRepo(): string {
  return localStorage.getItem(STORAGE_KEYS.REPO) || ''
}

export async function loadToken(): Promise<string | null> {
  const encrypted = getStoredToken()
  if (!encrypted) return null
  return decrypt(encrypted)
}

export async function saveToken(token: string): Promise<void> {
  const encrypted = await encrypt(token)
  localStorage.setItem(STORAGE_KEYS.ENCRYPTED_TOKEN, encrypted)
}

export function saveRepoConfig(owner: string, repo: string): void {
  localStorage.setItem(STORAGE_KEYS.OWNER, owner)
  localStorage.setItem(STORAGE_KEYS.REPO, repo)
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.OWNER)
  localStorage.removeItem(STORAGE_KEYS.REPO)
  localStorage.removeItem(STORAGE_KEYS.CRYPTO_SALT)
}

export async function verifyToken(token: string): Promise<{ login: string } | null> {
  const octokit = new Octokit({ auth: token })
  try {
    const { data } = await octokit.rest.users.getAuthenticated()
    return data
  } catch {
    return null
  }
}

export async function verifyRepo(token: string, owner: string, repo: string): Promise<boolean> {
  const octokit = new Octokit({ auth: token })
  try {
    await octokit.rest.repos.get({ owner, repo })
    return true
  } catch {
    return false
  }
}

