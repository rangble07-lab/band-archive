import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchArchive, storageModeLabel } from '../lib/api'
import type { ArchiveData } from '../types'
import { BandCard, NoticeToggle, SectionTitle } from '../components/ui'

export default function HomePage() {
  const [data, setData] = useState<ArchiveData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchArchive()
      .then((d) => {
        if (alive) setData(d)
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : '불러오기 실패')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

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
        <Link to="/edit" className="text-link">
          편집으로
        </Link>
      </main>
    )
  }

  const { profile, contacts, bands } = data
  const theCast = bands.filter((b) => b.category === 'the_cast')
  const solar = bands.filter((b) => b.category === 'solar_c')

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">◈</p>
        <h1>BAND</h1>
        <p className="identity">
          {profile.display_name} ({profile.handle}) 연공계
        </p>
        <p className="tagline">{profile.tagline}</p>
        {profile.extra_note ? <p className="extra">{profile.extra_note}</p> : null}
      </header>

      <hr className="rule" />

      <NoticeToggle notice={profile.notice} />

      <hr className="rule" />

      <SectionTitle>밴드 목록</SectionTitle>

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
              handle={b.handle}
              coverUrl={b.cover_url}
              faceUrl={b.face_url}
            />
          ))
        )}
      </section>

      <section className="block">
        <h3 className="subhead">솔라 씨 기반</h3>
        {solar.length === 0 ? (
          <p className="muted">아직 없음</p>
        ) : (
          solar.map((b) => (
            <BandCard
              key={b.id}
              bandName={b.band_name}
              faceName={b.face_name}
              handle={b.handle}
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
        <span className="muted">저장: {storageModeLabel()}</span>
        <Link to="/edit" className="text-link">
          편집
        </Link>
      </footer>
    </main>
  )
}
