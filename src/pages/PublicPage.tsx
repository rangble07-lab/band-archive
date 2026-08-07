import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchArchive } from '../lib/api'
import type { ArchiveData } from '../types'
import { isBandFilled } from '../types'
import { BandCard, NoticeToggle, SectionTitle } from '../components/ui'

export default function PublicPage() {
  const { slug = '' } = useParams()
  const [data, setData] = useState<ArchiveData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchArchive(slug)
      .then((d) => {
        if (alive) {
          setData(d)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (alive) {
          setData(null)
          setError(e instanceof Error ? e.message : '불러오기 실패')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [slug])

  if (loading) {
    return (
      <main className="page">
        <p className="muted">불러오는 중…</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page">
        <p className="error">{error ?? '데이터 없음'}</p>
        <Link to="/" className="text-link">
          허브로 돌아가기
        </Link>
      </main>
    )
  }

  const { profile, contacts, bands } = data
  const theCast = bands.filter((b) => b.category === 'the_cast' && isBandFilled(b))
  const solar = bands.filter((b) => b.category === 'solar_c' && isBandFilled(b))
  const hasContacts = Boolean(contacts.main.trim() || contacts.sub.trim() || contacts.other.trim())
  const hasProfile = Boolean(
    profile.display_name.trim() ||
      profile.handle.trim() ||
      profile.tagline.trim() ||
      profile.extra_note.trim(),
  )

  const themeStyle = {
    '--bg': profile.theme.bg,
    '--text': profile.theme.text,
    '--accent': profile.theme.accent,
    '--muted': profile.theme.text,
    '--line': `${profile.theme.accent}33`,
    '--card': profile.theme.bg,
    background: profile.theme.bg,
    color: profile.theme.text,
  } as CSSProperties

  return (
    <main className="page themed-page" style={themeStyle}>
      <header className="hero">
        <p className="eyebrow">◈</p>
        <h1>BAND</h1>
      </header>

      {hasProfile ? (
        <section className="profile-block">
          <SectionTitle>프로필</SectionTitle>
          {profile.display_name ? (
            <p>
              <span className="label">이름</span> {profile.display_name}
            </p>
          ) : null}
          {profile.handle ? (
            <p>
              <span className="label">계정</span> {profile.handle}
            </p>
          ) : null}
          {profile.tagline ? (
            <p>
              <span className="label">소개</span> {profile.tagline}
            </p>
          ) : null}
          {profile.extra_note ? (
            <p>
              <span className="label">추가문구</span> {profile.extra_note}
            </p>
          ) : null}
        </section>
      ) : null}

      {profile.notice.trim() ? (
        <>
          <hr className="rule" />
          <NoticeToggle notice={profile.notice} />
        </>
      ) : null}

      {theCast.length > 0 ? (
        <>
          <hr className="rule" />
          <section className="block">
            <h3 className="subhead">더 캐스트 기반</h3>
            {theCast.map((b) => (
              <BandCard
                key={b.id}
                bandName={b.band_name}
                faceName={b.face_name}
                coverUrl={b.cover_url}
                faceUrl={b.face_url}
              />
            ))}
          </section>
        </>
      ) : null}

      {solar.length > 0 ? (
        <>
          <hr className="rule" />
          <section className="block">
            <h3 className="subhead">SOLAR - C 기반</h3>
            {solar.map((b) => (
              <BandCard
                key={b.id}
                bandName={b.band_name}
                faceName={b.face_name}
                coverUrl={b.cover_url}
                faceUrl={b.face_url}
              />
            ))}
          </section>
        </>
      ) : null}

      {hasContacts ? (
        <>
          <hr className="rule" />
          <SectionTitle>기타 연락처</SectionTitle>
          <section className="contacts">
            {contacts.main.trim() ? <p>Main — {contacts.main}</p> : null}
            {contacts.sub.trim() ? <p>Sub — {contacts.sub}</p> : null}
            {contacts.other.trim() ? <p>기타 — {contacts.other}</p> : null}
          </section>
        </>
      ) : null}

      <footer className="footer">
        <div className="edit-actions">
          <Link to={`/p/${data.slug}/edit`} className="text-link">
            편집
          </Link>
          <Link to="/" className="text-link">
            허브
          </Link>
        </div>
      </footer>
    </main>
  )
}
