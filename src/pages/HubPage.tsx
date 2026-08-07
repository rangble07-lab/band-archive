import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPage } from '../lib/api'
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
          다녀온 밴드 아카이브 페이지 제작 허브입니다.
          <br />
          각자 페이지를 만들고, 타인에게는 공개 주소만 주세요.
        </p>
      </header>

      <hr className="rule" />

      <section className="edit-card">
        <h2 className="section-title">내 페이지 만들기</h2>
        <p className="muted">주소와 PIN 번호를 설정해 주세요.</p>
        <form className="pin-form" onSubmit={onCreate}>
          <label>
            페이지 주소
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="예: myname (* 해당 주소를 기억해 주세요.)"
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
          <button type="submit" className="btn primary btn-long" disabled={busy}>
            만들고 편집하기
          </button>
        </form>
      </section>

      <section className="edit-card">
        <h2 className="section-title">이미 만든 페이지 열고 편집하기</h2>
        <form className="pin-form" onSubmit={onOpen}>
          <label>
            페이지 주소
            <input
              value={openSlug}
              onChange={(e) => setOpenSlug(e.target.value)}
              placeholder="예 : sunset"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="btn primary btn-long">
            페이지 보기
          </button>
        </form>
        <p className="muted">편집은 페이지 아래 편집 버튼 → PIN 입력</p>
      </section>
    </main>
  )
}
