// Shared auth token: SHA-256 of the password, so the cookie never holds the
// raw password. Works in both the Edge middleware and the Node route handler.
export async function token(secret: string): Promise<string> {
  const data = new TextEncoder().encode('rw:' + secret)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const COOKIE = 'rw_auth'
