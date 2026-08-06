import { supabase, isSupabaseConfigured } from './supabase'
import { hashPin } from './auth'
import type { ArchiveData, Band, BandCategory, Contacts, Profile } from '../types'
import { EMPTY_CONTACTS, EMPTY_PROFILE, isValidSlug, normalizeSlug } from '../types'

const LOCAL_KEY = 'band-hub-pages-v1'

type LocalStore = Record<
  string,
  {
    pageId: string
    pinHash: string
    profile: Profile
    contacts: Contacts
    bands: Band[]
  }
>

function uid(): string {
  return crypto.randomUUID()
}

function emptyBands(): Band[] {
  return [
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
  ]
}

function loadStore(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as LocalStore) : {}
  } catch {
    return {}
  }
}

function saveStore(store: LocalStore): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(store))
}

function publicUrl(path: string | null): string | null {
  if (!path || !supabase) return path
  if (path.startsWith('http') || path.startsWith('data:')) return path
  const { data } = supabase.storage.from('band-images').getPublicUrl(path)
  return data.publicUrl
}

function pathFromPublicUrl(url: string | null): string | null {
  if (!url) return null
  if (url.includes('/object/public/band-images/')) {
    return url.split('/object/public/band-images/')[1] ?? null
  }
  if (!url.startsWith('http') && !url.startsWith('data:')) return url
  return null
}

export function storageModeLabel(): string {
  return isSupabaseConfigured ? 'Supabase 허브' : '이 기기 (localStorage 허브)'
}

export async function pageExists(slugInput: string): Promise<boolean> {
  const slug = normalizeSlug(slugInput)
  if (!slug) return false

  if (!isSupabaseConfigured || !supabase) {
    return Boolean(loadStore()[slug])
  }

  const { data, error } = await supabase.from('pages').select('id').eq('slug', slug).maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function createPage(slugInput: string, pin: string): Promise<string> {
  const slug = normalizeSlug(slugInput)
  if (!isValidSlug(slug)) {
    throw new Error('주소는 영문/숫자/하이픈 2~32자로 만들어 주세요.')
  }
  if (!pin || pin.length < 4) {
    throw new Error('PIN은 4자 이상으로 설정해 주세요.')
  }
  if (await pageExists(slug)) {
    throw new Error('이미 있는 주소입니다. 다른 이름을 골라 주세요.')
  }

  const pinHash = await hashPin(slug, pin)
  const pageId = uid()

  if (!isSupabaseConfigured || !supabase) {
    const store = loadStore()
    store[slug] = {
      pageId,
      pinHash,
      profile: { ...EMPTY_PROFILE },
      contacts: { ...EMPTY_CONTACTS },
      bands: emptyBands(),
    }
    saveStore(store)
    return slug
  }

  const { error: pageError } = await supabase.from('pages').insert({
    id: pageId,
    slug,
    pin_hash: pinHash,
    ...EMPTY_PROFILE,
  })
  if (pageError) throw pageError

  const { error: contactsError } = await supabase.from('contacts').insert({
    page_id: pageId,
    ...EMPTY_CONTACTS,
  })
  if (contactsError) throw contactsError

  const starter = emptyBands().map((b, i) => ({
    id: b.id,
    page_id: pageId,
    category: b.category,
    band_name: '',
    face_name: '',
    handle: '',
    cover_path: null,
    face_path: null,
    sort_order: i,
  }))
  const { error: bandsError } = await supabase.from('bands').insert(starter)
  if (bandsError) throw bandsError

  return slug
}

export async function verifyPagePin(slugInput: string, pin: string): Promise<boolean> {
  const slug = normalizeSlug(slugInput)
  const pinHash = await hashPin(slug, pin)

  if (!isSupabaseConfigured || !supabase) {
    const page = loadStore()[slug]
    return Boolean(page && page.pinHash === pinHash)
  }

  const { data, error } = await supabase.from('pages').select('pin_hash').eq('slug', slug).maybeSingle()
  if (error) throw error
  return Boolean(data && data.pin_hash === pinHash)
}

export async function fetchArchive(slugInput: string): Promise<ArchiveData> {
  const slug = normalizeSlug(slugInput)

  if (!isSupabaseConfigured || !supabase) {
    const page = loadStore()[slug]
    if (!page) throw new Error('페이지를 찾을 수 없습니다.')
    return {
      pageId: page.pageId,
      slug,
      profile: page.profile,
      contacts: page.contacts,
      bands: page.bands,
    }
  }

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (pageError) throw pageError
  if (!page) throw new Error('페이지를 찾을 수 없습니다.')

  const [contactsRes, bandsRes] = await Promise.all([
    supabase.from('contacts').select('*').eq('page_id', page.id).maybeSingle(),
    supabase.from('bands').select('*').eq('page_id', page.id).order('sort_order', { ascending: true }),
  ])
  if (contactsRes.error) throw contactsRes.error
  if (bandsRes.error) throw bandsRes.error

  return {
    pageId: page.id,
    slug,
    profile: {
      display_name: page.display_name ?? EMPTY_PROFILE.display_name,
      handle: page.handle ?? EMPTY_PROFILE.handle,
      tagline: page.tagline ?? EMPTY_PROFILE.tagline,
      extra_note: page.extra_note ?? EMPTY_PROFILE.extra_note,
      notice: page.notice ?? EMPTY_PROFILE.notice,
    },
    contacts: contactsRes.data
      ? {
          main: contactsRes.data.main ?? '',
          sub: contactsRes.data.sub ?? '',
          other: contactsRes.data.other ?? '',
        }
      : { ...EMPTY_CONTACTS },
    bands: (bandsRes.data ?? []).map((row) => ({
      id: row.id,
      category: row.category as BandCategory,
      band_name: row.band_name ?? '',
      face_name: row.face_name ?? '',
      handle: row.handle ?? '',
      cover_url: publicUrl(row.cover_path),
      face_url: publicUrl(row.face_path),
      sort_order: row.sort_order ?? 0,
    })),
  }
}

export async function saveProfile(slug: string, pageId: string, profile: Profile): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const store = loadStore()
    if (!store[slug]) throw new Error('페이지 없음')
    store[slug].profile = profile
    saveStore(store)
    return
  }

  const { error } = await supabase
    .from('pages')
    .update({ ...profile, updated_at: new Date().toISOString() })
    .eq('id', pageId)
  if (error) throw error
}

export async function saveContacts(slug: string, pageId: string, contacts: Contacts): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const store = loadStore()
    if (!store[slug]) throw new Error('페이지 없음')
    store[slug].contacts = contacts
    saveStore(store)
    return
  }

  const { error } = await supabase.from('contacts').upsert({
    page_id: pageId,
    ...contacts,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function upsertBand(slug: string, pageId: string, band: Band): Promise<Band> {
  if (!isSupabaseConfigured || !supabase) {
    const store = loadStore()
    if (!store[slug]) throw new Error('페이지 없음')
    const idx = store[slug].bands.findIndex((b) => b.id === band.id)
    if (idx >= 0) store[slug].bands[idx] = band
    else store[slug].bands.push(band)
    saveStore(store)
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
    page_id: pageId,
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

export async function deleteBand(slug: string, id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const store = loadStore()
    if (!store[slug]) return
    store[slug].bands = store[slug].bands.filter((b) => b.id !== id)
    saveStore(store)
    return
  }

  const { error } = await supabase.from('bands').delete().eq('id', id)
  if (error) throw error
}

export async function createBand(
  slug: string,
  pageId: string,
  category: BandCategory,
): Promise<Band> {
  const data = await fetchArchive(slug)
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
  return upsertBand(slug, pageId, band)
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
  slug: string,
  pageId: string,
  bandId: string,
  kind: 'cover' | 'face',
  file: File,
): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    const url = await fileToDataUrl(file)
    const store = loadStore()
    const band = store[slug]?.bands.find((b) => b.id === bandId)
    if (!band) throw new Error('밴드 없음')
    if (kind === 'cover') band.cover_url = url
    else band.face_url = url
    saveStore(store)
    return url
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${pageId}/${kind}s/${bandId}-${Date.now()}.${ext}`

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

export async function clearBandImage(
  slug: string,
  bandId: string,
  kind: 'cover' | 'face',
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const store = loadStore()
    const band = store[slug]?.bands.find((b) => b.id === bandId)
    if (!band) return
    if (kind === 'cover') band.cover_url = null
    else band.face_url = null
    saveStore(store)
    return
  }

  const column = kind === 'cover' ? 'cover_path' : 'face_path'
  const { error } = await supabase.from('bands').update({ [column]: null }).eq('id', bandId)
  if (error) throw error
}
