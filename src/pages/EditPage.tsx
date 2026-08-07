import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isEditUnlocked, lockEdit, unlockEdit } from '../lib/auth'
import {
  createBand,
  deleteBand,
  fetchArchive,
  saveContacts,
  saveProfile,
  storageModeLabel,
  upsertBand,
  verifyPagePin,
} from '../lib/api'
import type { ArchiveData, Band, BandCategory, Contacts, Profile } from '../types'
import { SectionTitle } from '../components/ui'

export default function EditPage() {
  const { slug = '' } = useParams()
  const [authed, setAuthed] = useState(() => isEditUnlocked(slug))
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [data, setData] = useState<ArchiveData | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const d = await fetchArchive(slug)
    setData(d)
  }, [slug])

  useEffect(() => {
    setAuthed(isEditUnlocked(slug))
  }, [slug])

  useEffect(() => {
    if (!authed) return
    reload().catch((e: unknown) => {
      setStatus(e instanceof Error ? e.message : '불러오기 실패')
    })
  }, [authed, reload])

  async function onUnlock(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setPinError(null)
    try {
      const ok = await verifyPagePin(slug, pin)
      if (!ok) {
        setPinError('PIN이 올바르지 않습니다')
        return
      }
      unlockEdit(slug)
      setAuthed(true)
      setPin('')
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : '확인 실패')
    } finally {
      setBusy(false)
    }
  }

  function onLock() {
    lockEdit(slug)
    setAuthed(false)
  }

  async function withBusy(fn: () => Promise<void>, okMsg: string) {
    setBusy(true)
    setStatus(null)
    try {
      await fn()
      setStatus(okMsg)
      await reload()
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setBusy(false)
    }
  }

  if (!authed) {
    return (
      <main className="page edit-page">
        <h1>편집 · {slug}</h1>
        <p className="muted">이 페이지 주인만 PIN으로 들어올 수 있습니다.</p>
        <form className="pin-form" onSubmit={onUnlock}>
          <label htmlFor="pin">PIN</label>
          <input
            id="pin"
            type="password"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN 입력"
          />
          {pinError ? <p className="error">{pinError}</p> : null}
          <button type="submit" className="btn primary" disabled={busy}>
            잠금 해제
          </button>
        </form>
        <div className="edit-actions">
          <Link to={`/p/${slug}`} className="text-link">
            공개 페이지
          </Link>
          <Link to="/" className="text-link">
            허브
          </Link>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="page">
        <p className="muted">불러오는 중…</p>
      </main>
    )
  }

  return (
    <main className="page edit-page">
      <header className="edit-top">
        <div>
          <h1>편집 · {slug}</h1>
          <p className="muted">저장: {storageModeLabel()}</p>
        </div>
        <div className="edit-actions">
          <Link to={`/p/${slug}`} className="btn ghost">
            미리보기
          </Link>
          <button type="button" className="btn ghost" onClick={onLock}>
            잠금
          </button>
        </div>
      </header>

      {status ? <p className="status">{status}</p> : null}

      <ProfileEditor
        profile={data.profile}
        busy={busy}
        onSave={(profile) =>
          withBusy(() => saveProfile(slug, data.pageId, profile), '프로필 저장됨')
        }
      />

      <BandSection
        title="더 캐스트 기반"
        category="the_cast"
        slug={slug}
        pageId={data.pageId}
        bands={data.bands.filter((b) => b.category === 'the_cast')}
        busy={busy}
        onChange={withBusy}
      />

      <BandSection
        title="SOLAR - C 기반"
        category="solar_c"
        slug={slug}
        pageId={data.pageId}
        bands={data.bands.filter((b) => b.category === 'solar_c')}
        busy={busy}
        onChange={withBusy}
      />

      <ContactsEditor
        contacts={data.contacts}
        busy={busy}
        onSave={(contacts) =>
          withBusy(() => saveContacts(slug, data.pageId, contacts), '연락처 저장됨')
        }
      />
    </main>
  )
}

function ProfileEditor({
  profile,
  busy,
  onSave,
}: {
  profile: Profile
  busy: boolean
  onSave: (p: Profile) => void
}) {
  const [form, setForm] = useState(profile)
  useEffect(() => setForm(profile), [profile])

  return (
    <section className="edit-card">
      <SectionTitle>프로필</SectionTitle>
      <label>
        이름
        <input
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          placeholder="이름"
        />
      </label>
      <label>
        계정
        <input
          value={form.handle}
          onChange={(e) => setForm({ ...form, handle: e.target.value })}
          placeholder="@account"
        />
      </label>
      <label>
        소개
        <textarea
          rows={2}
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          placeholder="(* 예시 : 밴드 역계 백업용 페이지입니다.)"
        />
      </label>
      <label>
        추가문구
        <textarea
          rows={2}
          value={form.extra_note}
          onChange={(e) => setForm({ ...form, extra_note: e.target.value })}
          placeholder="추가문구"
        />
      </label>
      <label>
        처음이라면 (*공지 문구입니다.)
        <textarea
          rows={3}
          value={form.notice}
          onChange={(e) => setForm({ ...form, notice: e.target.value })}
          placeholder="(* 공지 문구입니다.)"
        />
      </label>
      <button type="button" className="btn primary" disabled={busy} onClick={() => onSave(form)}>
        프로필 저장
      </button>
    </section>
  )
}

function ContactsEditor({
  contacts,
  busy,
  onSave,
}: {
  contacts: Contacts
  busy: boolean
  onSave: (c: Contacts) => void
}) {
  const [form, setForm] = useState(contacts)
  useEffect(() => setForm(contacts), [contacts])

  return (
    <section className="edit-card">
      <SectionTitle>기타 연락처</SectionTitle>
      <label>
        Main
        <input value={form.main} onChange={(e) => setForm({ ...form, main: e.target.value })} />
      </label>
      <label>
        Sub
        <input value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value })} />
      </label>
      <label>
        기타
        <input value={form.other} onChange={(e) => setForm({ ...form, other: e.target.value })} />
      </label>
      <button type="button" className="btn primary" disabled={busy} onClick={() => onSave(form)}>
        연락처 저장
      </button>
    </section>
  )
}

function BandSection({
  title,
  category,
  slug,
  pageId,
  bands,
  busy,
  onChange,
}: {
  title: string
  category: BandCategory
  slug: string
  pageId: string
  bands: Band[]
  busy: boolean
  onChange: (fn: () => Promise<void>, msg: string) => Promise<void>
}) {
  return (
    <section className="edit-card">
      <div className="row-between">
        <SectionTitle>{title}</SectionTitle>
        <button
          type="button"
          className="btn ghost"
          disabled={busy}
          onClick={() =>
            onChange(() => createBand(slug, pageId, category).then(() => undefined), '밴드 추가됨')
          }
        >
          + 추가
        </button>
      </div>
      {bands.map((band) => (
        <BandEditor
          key={band.id}
          slug={slug}
          pageId={pageId}
          band={band}
          busy={busy}
          onChange={onChange}
        />
      ))}
    </section>
  )
}

function BandEditor({
  slug,
  pageId,
  band,
  busy,
  onChange,
}: {
  slug: string
  pageId: string
  band: Band
  busy: boolean
  onChange: (fn: () => Promise<void>, msg: string) => Promise<void>
}) {
  const [form, setForm] = useState(band)
  useEffect(() => setForm(band), [band])

  return (
    <div className="band-editor">
      <label>
        밴드명
        <input
          value={form.band_name}
          onChange={(e) => setForm({ ...form, band_name: e.target.value })}
          placeholder="밴드명"
        />
      </label>
      <label>
        낯
        <input
          value={form.face_name}
          onChange={(e) => setForm({ ...form, face_name: e.target.value })}
          placeholder="낯"
        />
      </label>
      <label>
        밴드 커버 URL
        <input
          value={form.cover_url ?? ''}
          onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
          placeholder="https://… (Imgur, Catbox, Discord 등)"
        />
      </label>
      {form.cover_url ? (
        <img src={form.cover_url} alt="커버 미리보기" className="thumb preview-thumb" />
      ) : null}
      <label>
        낯 사진 URL
        <input
          value={form.face_url ?? ''}
          onChange={(e) => setForm({ ...form, face_url: e.target.value })}
          placeholder="https://… (Imgur, Catbox, Discord 등)"
        />
      </label>
      {form.face_url ? (
        <img src={form.face_url} alt="낯 미리보기" className="thumb preview-thumb" />
      ) : null}

      <div className="row-between">
        <button
          type="button"
          className="btn primary"
          disabled={busy}
          onClick={() =>
            onChange(() => upsertBand(slug, pageId, form).then(() => undefined), '밴드 저장됨')
          }
        >
          이 밴드 저장
        </button>
        <button
          type="button"
          className="btn danger"
          disabled={busy}
          onClick={() => {
            if (confirm('이 밴드를 삭제할까요?')) {
              void onChange(() => deleteBand(slug, band.id), '삭제됨')
            }
          }}
        >
          삭제
        </button>
      </div>
    </div>
  )
}
