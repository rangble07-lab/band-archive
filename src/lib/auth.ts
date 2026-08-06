const flag = (slug: string) => `band-hub-edit:${slug}`

export function isEditUnlocked(slug: string): boolean {
  return sessionStorage.getItem(flag(slug)) === '1'
}

export function unlockEdit(slug: string): void {
  sessionStorage.setItem(flag(slug), '1')
}

export function lockEdit(slug: string): void {
  sessionStorage.removeItem(flag(slug))
}

export async function hashPin(slug: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${slug}:${pin}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
