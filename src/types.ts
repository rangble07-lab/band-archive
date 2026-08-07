export type BandCategory = 'the_cast' | 'solar_c' | 'solar_c_1st'

export interface Theme {
  accent: string
  bg: string
  text: string
}

export interface Profile {
  display_name: string
  handle: string
  tagline: string
  extra_note: string
  notice: string
  theme: Theme
}

export interface Contacts {
  text: string
}

export interface Band {
  id: string
  category: BandCategory
  band_name: string
  face_name: string
  handle: string
  cover_url: string | null
  face_url: string | null
  year: number | null
  sort_order: number
}

export interface ArchiveData {
  pageId: string
  slug: string
  profile: Profile
  contacts: Contacts
  bands: Band[]
}

export const DEFAULT_THEME: Theme = {
  accent: '#8B6F5C',
  bg: '#F7F5F2',
  text: '#1A1A1A',
}

export const EMPTY_PROFILE: Profile = {
  display_name: '',
  handle: '',
  tagline: '',
  extra_note: '',
  notice: '',
  theme: { ...DEFAULT_THEME },
}

export const EMPTY_CONTACTS: Contacts = {
  text: '',
}

export function isBandFilled(band: Band): boolean {
  return Boolean(
    band.band_name.trim() ||
      band.face_name.trim() ||
      band.cover_url ||
      band.face_url,
  )
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
