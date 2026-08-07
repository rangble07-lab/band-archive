import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchArchive } from '../lib/api'
import type { ArchiveData } from '../types'
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
  const theCast = bands.filter((b) => b.category === 'the_cast')
  const solar = bands.filter((b) => b.category === 'solar_c')
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/p/${data.slug}` : `/p/${data.slug}`

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">◈</p>
        <h1>BAND</h1>
      </header>

      <section className="profile-block">
        <SectionTitle>프로필</SectionTitle>
        <p>
          <span className="label">이름</span> {profile.display_name || '—'}
        </p>
        <p>
          <span className="label">계정</span> {profile.handle || '—'}
        </p>
        <p>
          <span className="label">소개</span> {profile.tagline || '—'}
        </p>
        {profile.extra_note ? (
          <p>
            <span className="label">추가문구</span> {profile.extra_note}
          </p>
        ) : null}
      </section>

      <hr className="rule" />

      <NoticeToggle notice={profile.notice} />

      <hr className="rule" />

      <section className="block">
        <h3 className="subhead">더 캐스트 기반</h3>
        {theCast.length === 0 ? (
          <p className="muted">아직 없음</p>
        ) : (
          theCast.map((b) => (
            <BandCard
              key={b.id}
              bandName={b.band_name}
              faceName={b.face_name}
              coverUrl={b.cover_url}
              faceUrl={b.face_url}
            />
          ))
        )}
      </section>

      <section className="block">
        <h3 className="subhead">SOLAR - C 기반</h3>
        {solar.length === 0 ? (
          <p className="muted">아직 없음</p>
        ) : (
          solar.map((b) => (
            <BandCard
              key={b.id}
              bandName={b.band_name}
              faceName={b.face_name}
              coverUrl={b.cover_url}
              faceUrl={b.face_url}
            />
          ))
        )}
      </section>

      <hr className="rule" />

      <SectionTitle>기타 연락처</SectionTitle>
      <section className="contacts">
        <p>Main — {contacts.main}</p>
        <p>Sub — {contacts.sub}</p>
        <p>기타 — {contacts.other}</p>
      </section>

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
