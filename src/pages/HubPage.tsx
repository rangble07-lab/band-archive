import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPage, storageModeLabel } from '../lib/api'
import { unlockEdit } from '../lib/auth'
import { normalizeSlug } from '../types'

export default function HubPage() {
  const navigate = useNavigate()
  const [slug, setSlug] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openSlug, setOpenSlug] = useState('')

  const preview = normalizeSlug(slug)

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await createPage(slug, pin)
      unlockEdit(created)
      navigate(`/p/${created}/edit`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '생성 실패')
    } finally {
      setBusy(false)
    }
  }

  function onOpen(e: FormEvent) {
    e.preventDefault()
    const s = normalizeSlug(openSlug)
    if (!s) {
      setError('주소를 입력해 주세요.')
      return
    }
    navigate(`/p/${s}`)
  }

  return (
    <main className="page hub-page">
      <header className="hero">
        <p className="eyebrow">◈</p>
        <h1>BAND Hub</h1>
        <p className="tagline">
          다녀온 메신저 밴드를 링크로 공유하는 허브입니다.
          <br />
          각자 페이지를 만들고, 남에게는 공개 주소만 주면 됩니다.
        </p>
        <p className="muted">저장: {storageModeLabel()}</p>
      </header>

      <hr className="rule" />

      <section className="edit-card">
        <h2 className="section-title">내 페이지 만들기</h2>
        <p className="muted">
          사진은 Imgur / Catbox / Discord 등에 올린 뒤 <strong>링크만</strong> 붙여넣으면 됩니다.
        </p>
        <form className="pin-form" onSubmit={onCreate}>
          <label>
            페이지 주소
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="예: cozy / myname"
              autoComplete="off"
            />
          </label>
          {preview ? (
            <p className="muted">
              공개 링크: <code>/p/{preview}</code>
            </p>
          ) : null}
          <label>
            편집 PIN (4자 이상)
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="나만 아는 비밀번호"
              autoComplete="new-password"
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn primary" disabled={busy}>
            만들고 편집하기
          </button>
        </form>
      </section>

      <section className="edit-card">
        <h2 className="section-title">이미 만든 페이지 열기</h2>
        <form className="pin-form" onSubmit={onOpen}>
          <label>
            페이지 주소
            <input
              value={openSlug}
              onChange={(e) => setOpenSlug(e.target.value)}
              placeholder="예: cozy"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="btn ghost">
            공개 페이지 보기
          </button>
        </form>
        <p className="muted">
          편집은 공개 페이지 아래 <strong>편집</strong> 버튼 → PIN 입력
        </p>
      </section>

      <footer className="footer">
        <span className="muted">템플릿 사본 없이, 이 사이트만 쓰면 됩니다.</span>
        <Link to="/" className="text-link">
          맨 위
        </Link>
      </footer>
    </main>
  )
}
