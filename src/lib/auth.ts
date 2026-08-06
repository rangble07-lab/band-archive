const FLAG = 'band-archive-edit-ok'

export function getConfiguredPin(): string {
  return (import.meta.env.VITE_EDIT_PIN as string | undefined)?.trim() || '1234'
}

export function isEditUnlocked(): boolean {
  return sessionStorage.getItem(FLAG) === '1'
}

export function unlockEdit(pin: string): boolean {
  if (pin === getConfiguredPin()) {
    sessionStorage.setItem(FLAG, '1')
    return true
  }
  return false
}

export function lockEdit(): void {
  sessionStorage.removeItem(FLAG)
}
