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

  useEffect(() => {
    if (!data?.profile.theme) return
    const root = document.documentElement
    const { bg, text, accent } = data.profile.theme
    const prev = {
      bg: root.style.getPropertyValue('--bg'),
      text: root.style.getPropertyValue('--text'),
      accent: root.style.getPropertyValue('--accent'),
      muted: root.style.getPropertyValue('--muted'),
      line: root.style.getPropertyValue('--line'),
      card: root.style.getPropertyValue('--card'),
      color: root.style.color,
      background: root.style.background,
    }
    root.style.setProperty('--bg', bg)
    root.style.setProperty('--text', text)
    root.style.setProperty('--accent', accent)
    root.style.setProperty('--muted', text)
    root.style.setProperty('--line', `${accent}33`)
    root.style.setProperty('--card', bg)
    root.style.color = text
    root.style.background = bg
    document.body.style.background = bg
    return () => {
      root.style.setProperty('--bg', prev.bg)
      root.style.setProperty('--text', prev.text)
      root.style.setProperty('--accent', prev.accent)
      root.style.setProperty('--muted', prev.muted)
      root.style.setProperty('--line', prev.line)
      root.style.setProperty('--card', prev.card)
      root.style.color = prev.color
      root.style.background = prev.background
      document.body.style.background = ''
    }
  }, [data])

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
  const solar1st = bands.filter((b) => b.category === 'solar_c_1st' && isBandFilled(b))
  const hasContacts = Boolean(contacts.text.trim())
  const hasProfile = Boolean(
    profile.display_name.trim() ||
      profile.handle.trim() ||
      profile.tagline.trim() ||
      profile.extra_note.trim(),
  )

  const themeStyle = {
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

      {solar1st.length > 0 ? (
        <>
          <hr className="rule" />
          <section className="block">
            <h3 className="subhead">SOLAR - C 1차</h3>
            {solar1st.map((b) => (
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
            <p className="contacts-body">{contacts.text}</p>
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
