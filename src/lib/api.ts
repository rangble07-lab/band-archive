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

export const MAX_HUB_IMAGES_PER_PAGE = 20
export const MAX_UPLOAD_BYTES = 1 * 1024 * 1024 // 1MB

function publicUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('//')) return path
  if (!supabase) return path
  const { data } = supabase.storage.from('band-images').getPublicUrl(path)
  return data.publicUrl
}

function normalizeImageUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim() ?? ''
  return trimmed ? trimmed : null
}

/** Hub-hosted (counts toward quota). External https links do not. */
export function isHubHostedImage(url: string | null | undefined): boolean {
  if (!url) return false
  const u = url.trim()
  if (!u) return false
  if (u.startsWith('data:')) return true
  if (u.includes('/object/public/band-images/') || u.includes('/band-images/')) return true
  if (!/^https?:\/\//i.test(u) && !u.startsWith('//')) return true
  return false
}

export function countHubImages(bands: Band[]): number {
  let n = 0
  for (const b of bands) {
    if (isHubHostedImage(b.cover_url)) n += 1
    if (isHubHostedImage(b.face_url)) n += 1
  }
  return n
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
  const cover_path = normalizeImageUrl(band.cover_url)
  const face_path = normalizeImageUrl(band.face_url)
  const next: Band = {
    ...band,
    cover_url: cover_path,
    face_url: face_path,
  }

  if (!isSupabaseConfigured || !supabase) {
    const store = loadStore()
    if (!store[slug]) throw new Error('페이지 없음')
    const idx = store[slug].bands.findIndex((b) => b.id === band.id)
    if (idx >= 0) store[slug].bands[idx] = next
    else store[slug].bands.push(next)
    saveStore(store)
    return next
  }

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
  return next
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
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('장당 1MB까지 업로드할 수 있습니다. 더 큰 사진은 외부 링크를 붙여 주세요.')
  }

  const archive = await fetchArchive(slug)
  const band = archive.bands.find((b) => b.id === bandId)
  if (!band) throw new Error('밴드 없음')

  const currentSlot = kind === 'cover' ? band.cover_url : band.face_url
  const replacingHub = isHubHostedImage(currentSlot)
  const used = countHubImages(archive.bands)
  if (!replacingHub && used >= MAX_HUB_IMAGES_PER_PAGE) {
    throw new Error(
      `허브 업로드는 페이지당 ${MAX_HUB_IMAGES_PER_PAGE}장까지입니다. 추가 사진은 Imgur/Catbox 등 링크를 붙여 주세요.`,
    )
  }

  if (!isSupabaseConfigured || !supabase) {
    const url = await fileToDataUrl(file)
    const store = loadStore()
    const localBand = store[slug]?.bands.find((b) => b.id === bandId)
    if (!localBand) throw new Error('밴드 없음')
    if (kind === 'cover') localBand.cover_url = url
    else localBand.face_url = url
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
