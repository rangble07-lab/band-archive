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
  profile: Profile
  contacts: Contacts
  bands: Band[]
}

export const EMPTY_PROFILE: Profile = {
  display_name: 'ㅇㅇ',
  handle: '@account',
  tagline: '밴드 역계 백업용 페이지입니다.',
  extra_note: '(* 추가 할 말이 있으면 써 주세요.)',
  notice: '(* 본인에 관한 추가 공지를 써 주세요.)',
}

export const EMPTY_CONTACTS: Contacts = {
  main: '@_____',
  sub: '@_____',
  other: '_____',
}
