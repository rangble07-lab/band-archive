import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isEditUnlocked, lockEdit, unlockEdit } from '../lib/auth'
import {
  MAX_HUB_IMAGES_PER_PAGE,
  clearBandImage,
  countHubImages,
  createBand,
  deleteBand,
  fetchArchive,
  isHubHostedImage,
  saveContacts,
  saveProfile,
  uploadBandImage,
  upsertBand,
  verifyPagePin,
} from '../lib/api'
import type { ArchiveData, Band, BandCategory, Contacts, Profile } from '../types'
import { SectionTitle } from '../components/ui'
import { NoticeEditor } from '../components/NoticeEditor'

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
        <div className="edit-actions" style={{ marginBottom: 16 }}>
          <Link to={`/p/${slug}`} className="btn ghost">
            페이지 보기
          </Link>
        </div>
        <form className="pin-form" onSubmit={onUnlock}>
          <label htmlFor="pin">PIN 번호</label>
          <input
            id="pin"
            type="password"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN 번호"
          />
          {pinError ? <p className="error">{pinError}</p> : null}
          <button type="submit" className="btn primary btn-long" disabled={busy}>
            잠금 해제
          </button>
        </form>
        <div className="edit-actions">
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
        </div>
        <div className="edit-actions">
          <Link to={`/p/${slug}`} className="btn ghost">
            페이지 보기
          </Link>
          <button type="button" className="btn ghost" onClick={onLock}>
            잠금
          </button>
        </div>
      </header>

      {status ? <p className="status">{status}</p> : null}

      <p className="muted image-quota">
        이미지 업로드 {countHubImages(data.bands)}/{MAX_HUB_IMAGES_PER_PAGE}장 · 장당 1MB 이하
        <br />
        한도를 넘기면 Imgur / Catbox / Discord 등 이미지 링크를 붙여 주세요.
      </p>

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
        allBands={data.bands}
        busy={busy}
        onChange={withBusy}
      />

      <BandSection
        title="SOLAR - C 기반"
        category="solar_c"
        slug={slug}
        pageId={data.pageId}
        bands={data.bands.filter((b) => b.category === 'solar_c')}
        allBands={data.bands}
        busy={busy}
        onChange={withBusy}
      />

      <BandSection
        title="SOLAR - C 1차"
        category="solar_c_1st"
        slug={slug}
        pageId={data.pageId}
        bands={data.bands.filter((b) => b.category === 'solar_c_1st')}
        allBands={data.bands}
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

      <section className="edit-card create-page-tab">
        <h2 className="section-title">페이지 만들기</h2>
        <p className="muted">저장한 내용이 공개 페이지로 보이는지 확인해 보세요.</p>
        <Link to={`/p/${slug}`} className="btn primary btn-long">
          페이지 만들기
        </Link>
      </section>
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
        <NoticeEditor
          value={form.notice}
          onChange={(notice) => setForm({ ...form, notice })}
          placeholder="(* 공지 문구입니다.)"
        />
      </label>
      <div className="theme-row">
        <label>
          강조색
          <input
            type="color"
            value={form.theme.accent}
            onChange={(e) =>
              setForm({ ...form, theme: { ...form.theme, accent: e.target.value } })
            }
          />
        </label>
        <label>
          배경색
          <input
            type="color"
            value={form.theme.bg}
            onChange={(e) => setForm({ ...form, theme: { ...form.theme, bg: e.target.value } })}
          />
        </label>
        <label>
          글자색
          <input
            type="color"
            value={form.theme.text}
            onChange={(e) => setForm({ ...form, theme: { ...form.theme, text: e.target.value } })}
          />
        </label>
      </div>
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
        기타 연락처
        <textarea
          rows={4}
          value={form.text}
          onChange={(e) => setForm({ text: e.target.value })}
          placeholder="자유롭게 적어 주세요."
        />
      </label>
      <button type="button" className="btn primary btn-long" disabled={busy} onClick={() => onSave(form)}>
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
  allBands,
  busy,
  onChange,
}: {
  title: string
  category: BandCategory
  slug: string
  pageId: string
  bands: Band[]
  allBands: Band[]
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
          hubUsed={countHubImages(allBands)}
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
  hubUsed,
  busy,
  onChange,
}: {
  slug: string
  pageId: string
  band: Band
  hubUsed: number
  busy: boolean
  onChange: (fn: () => Promise<void>, msg: string) => Promise<void>
}) {
  const [form, setForm] = useState(band)
  useEffect(() => setForm(band), [band])

  async function onFile(kind: 'cover' | 'face', file: File | null) {
    if (!file) return
    await onChange(async () => {
      const url = await uploadBandImage(slug, pageId, band.id, kind, file)
      setForm({
        ...form,
        cover_url: kind === 'cover' ? url : form.cover_url,
        face_url: kind === 'face' ? url : form.face_url,
      })
    }, `${kind === 'cover' ? '밴드 커버' : '낯'} 업로드됨`)
  }

  const coverIsHub = isHubHostedImage(form.cover_url)
  const faceIsHub = isHubHostedImage(form.face_url)
  const atLimit = hubUsed >= MAX_HUB_IMAGES_PER_PAGE

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

      <div className="photo-edit-row">
        <ImageSlot
          label="밴드 커버"
          url={form.cover_url}
          isHub={coverIsHub}
          uploadDisabled={busy || (atLimit && !coverIsHub)}
          onUrlChange={(v) => setForm({ ...form, cover_url: v })}
          onPick={(f) => onFile('cover', f)}
          onClearHub={() =>
            onChange(async () => {
              await clearBandImage(slug, band.id, 'cover')
              setForm({ ...form, cover_url: null })
            }, '밴드 커버 삭제됨')
          }
        />
        <ImageSlot
          label="낯"
          url={form.face_url}
          isHub={faceIsHub}
          uploadDisabled={busy || (atLimit && !faceIsHub)}
          onUrlChange={(v) => setForm({ ...form, face_url: v })}
          onPick={(f) => onFile('face', f)}
          onClearHub={() =>
            onChange(async () => {
              await clearBandImage(slug, band.id, 'face')
              setForm({ ...form, face_url: null })
            }, '낯 사진 삭제됨')
          }
        />
      </div>

      {atLimit ? (
        <p className="muted">
          이미지 업로드 한도({MAX_HUB_IMAGES_PER_PAGE}장)에 도달했습니다. 추가는 아래 URL로 넣어
          주세요.
        </p>
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

function ImageSlot({
  label,
  url,
  isHub,
  uploadDisabled,
  onUrlChange,
  onPick,
  onClearHub,
}: {
  label: string
  url: string | null
  isHub: boolean
  uploadDisabled: boolean
  onUrlChange: (v: string) => void
  onPick: (file: File | null) => void
  onClearHub: () => void
}) {
  return (
    <div className="image-field">
      <p className="label">{label}</p>
      {url ? (
        <img src={url} alt={label} className="thumb" />
      ) : (
        <div className="photo-empty sm">없음</div>
      )}
      <label className={`btn ghost file-btn${uploadDisabled ? ' is-disabled' : ''}`}>
        업로드 1MB 이하
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={uploadDisabled}
          hidden
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
      </label>
      {isHub && url ? (
        <button type="button" className="btn ghost" onClick={onClearHub}>
          업로드 삭제
        </button>
      ) : null}
      <label>
        또는 링크
        <input
          value={isHub ? '' : (url ?? '')}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://…"
        />
      </label>
      {isHub ? <p className="muted tiny">현재: 이미지 업로드</p> : null}
    </div>
  )
}
