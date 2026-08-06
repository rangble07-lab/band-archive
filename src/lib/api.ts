import { supabase, isSupabaseConfigured } from './supabase'
import type { ArchiveData, Band, BandCategory, Contacts, Profile } from '../types'
import { EMPTY_CONTACTS, EMPTY_PROFILE } from '../types'

const LOCAL_KEY = 'band-archive-data'

function uid(): string {
  return crypto.randomUUID()
}

function defaultData(): ArchiveData {
  return {
    profile: { ...EMPTY_PROFILE },
    contacts: { ...EMPTY_CONTACTS },
    bands: [
      {
        id: uid(),
        category: 'the_cast',
        band_name: '',
        face_name: '',
        handle: '',
        cover_url: null,
        face_url: null,
        sort_order: 0,
      },
      {
        id: uid(),
        category: 'solar_c',
        band_name: '',
        face_name: '',
        handle: '',
        cover_url: null,
        face_url: null,
        sort_order: 0,
      },
    ],
  }
}

function loadLocal(): ArchiveData {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) {
      const data = defaultData()
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
      return data
    }
    return JSON.parse(raw) as ArchiveData
  } catch {
    return defaultData()
  }
}

function saveLocal(data: ArchiveData): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

function publicUrl(path: string | null): string | null {
  if (!path || !supabase) return path
  if (path.startsWith('http') || path.startsWith('data:')) return path
  const { data } = supabase.storage.from('band-images').getPublicUrl(path)
  return data.publicUrl
}

export async function fetchArchive(): Promise<ArchiveData> {
  if (!isSupabaseConfigured || !supabase) {
    return loadLocal()
  }

  const [profileRes, contactsRes, bandsRes] = await Promise.all([
    supabase.from('profile').select('*').eq('id', 1).maybeSingle(),
    supabase.from('contacts').select('*').eq('id', 1).maybeSingle(),
    supabase.from('bands').select('*').order('sort_order', { ascending: true }),
  ])

  if (profileRes.error) throw profileRes.error
  if (contactsRes.error) throw contactsRes.error
  if (bandsRes.error) throw bandsRes.error

  const profile: Profile = profileRes.data
    ? {
        display_name: profileRes.data.display_name ?? EMPTY_PROFILE.display_name,
        handle: profileRes.data.handle ?? EMPTY_PROFILE.handle,
        tagline: profileRes.data.tagline ?? EMPTY_PROFILE.tagline,
        extra_note: profileRes.data.extra_note ?? EMPTY_PROFILE.extra_note,
        notice: profileRes.data.notice ?? EMPTY_PROFILE.notice,
      }
    : { ...EMPTY_PROFILE }

  const contacts: Contacts = contactsRes.data
    ? {
        main: contactsRes.data.main ?? EMPTY_CONTACTS.main,
        sub: contactsRes.data.sub ?? EMPTY_CONTACTS.sub,
        other: contactsRes.data.other ?? EMPTY_CONTACTS.other,
      }
    : { ...EMPTY_CONTACTS }

  const bands: Band[] = (bandsRes.data ?? []).map((row) => ({
    id: row.id,
    category: row.category as BandCategory,
    band_name: row.band_name ?? '',
    face_name: row.face_name ?? '',
    handle: row.handle ?? '',
    cover_url: publicUrl(row.cover_path),
    face_url: publicUrl(row.face_path),
    sort_order: row.sort_order ?? 0,
  }))

  return { profile, contacts, bands }
}

export async function saveProfile(profile: Profile): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const data = loadLocal()
    data.profile = profile
    saveLocal(data)
    return
  }

  const { error } = await supabase.from('profile').upsert({
    id: 1,
    ...profile,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function saveContacts(contacts: Contacts): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const data = loadLocal()
    data.contacts = contacts
    saveLocal(data)
    return
  }

  const { error } = await supabase.from('contacts').upsert({
    id: 1,
    ...contacts,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

function pathFromPublicUrl(url: string | null): string | null {
  if (!url) return null
  if (url.includes('/object/public/band-images/')) {
    return url.split('/object/public/band-images/')[1] ?? null
  }
  if (!url.startsWith('http') && !url.startsWith('data:')) return url
  return null
}

export async function upsertBand(band: Band): Promise<Band> {
  if (!isSupabaseConfigured || !supabase) {
    const data = loadLocal()
    const idx = data.bands.findIndex((b) => b.id === band.id)
    if (idx >= 0) data.bands[idx] = band
    else data.bands.push(band)
    saveLocal(data)
    return band
  }

  const { data: existing } = await supabase
    .from('bands')
    .select('cover_path, face_path')
    .eq('id', band.id)
    .maybeSingle()

  const cover_path =
    band.cover_url === null
      ? null
      : (pathFromPublicUrl(band.cover_url) ?? existing?.cover_path ?? null)
  const face_path =
    band.face_url === null
      ? null
      : (pathFromPublicUrl(band.face_url) ?? existing?.face_path ?? null)

  const row = {
    id: band.id,
    category: band.category,
    band_name: band.band_name,
    face_name: band.face_name,
    handle: band.handle,
    cover_path,
    face_path,
    sort_order: band.sort_order,
  }

  const { error } = await supabase.from('bands').upsert(row)
  if (error) throw error
  return {
    ...band,
    cover_url: publicUrl(cover_path),
    face_url: publicUrl(face_path),
  }
}

export async function deleteBand(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const data = loadLocal()
    data.bands = data.bands.filter((b) => b.id !== id)
    saveLocal(data)
    return
  }

  const { error } = await supabase.from('bands').delete().eq('id', id)
  if (error) throw error
}

export async function createBand(category: BandCategory): Promise<Band> {
  const data = await fetchArchive()
  const same = data.bands.filter((b) => b.category === category)
  const band: Band = {
    id: uid(),
    category,
    band_name: '',
    face_name: '',
    handle: '',
    cover_url: null,
    face_url: null,
    sort_order: same.length,
  }
  return upsertBand(band)
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function uploadBandImage(
  bandId: string,
  kind: 'cover' | 'face',
  file: File,
): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    return fileToDataUrl(file)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${kind}s/${bandId}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('band-images').upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error

  const column = kind === 'cover' ? 'cover_path' : 'face_path'
  const { error: updateError } = await supabase
    .from('bands')
    .update({ [column]: path })
    .eq('id', bandId)
  if (updateError) throw updateError

  return publicUrl(path)!
}

export async function clearBandImage(bandId: string, kind: 'cover' | 'face'): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const data = loadLocal()
    const band = data.bands.find((b) => b.id === bandId)
    if (!band) return
    if (kind === 'cover') band.cover_url = null
    else band.face_url = null
    saveLocal(data)
    return
  }

  const column = kind === 'cover' ? 'cover_path' : 'face_path'
  const { error } = await supabase.from('bands').update({ [column]: null }).eq('id', bandId)
  if (error) throw error
}

export function storageModeLabel(): string {
  return isSupabaseConfigured ? 'Supabase' : '이 기기 (localStorage)'
}
