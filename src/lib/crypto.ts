export async function encrypt(plaintext: string): Promise<string> {
  return btoa(plaintext)
}

export async function decrypt(ciphertextB64: string): Promise<string> {
  try {
    return atob(ciphertextB64)
  } catch {
    return ''
  }
}
