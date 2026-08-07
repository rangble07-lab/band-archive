export type BandCategory = 'the_cast' | 'solar_c'

export interface Profile {
  display_name: string
  handle: string
  tagline: string
  extra_note: string
  notice: string
}

export interface Contacts {
  main: string
  sub: string
  other: string
}

export interface Band {
  id: string
  category: BandCategory
  band_name: string
  face_name: string
  handle: string
  cover_url: string | null
  face_url: string | null
  sort_order: number
}

export interface ArchiveData {
  pageId: string
  slug: string
  profile: Profile
  contacts: Contacts
  bands: Band[]
}

export const EMPTY_PROFILE: Profile = {
  display_name: '',
  handle: '',
  tagline: '',
  extra_note: '',
  notice: '',
}

export const EMPTY_CONTACTS: Contacts = {
  main: '@_____',
  sub: '@_____',
  other: '_____',
}

export function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{1,31}$/.test(slug)
}
