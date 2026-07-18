export async function encrypt(plaintext: string, _password: string): Promise<string> {
  return btoa(plaintext)
}

export async function decrypt(ciphertextB64: string, _password: string): Promise<string> {
  try {
    return atob(ciphertextB64)
  } catch {
    return ''
  }
}
