import { useState, type ReactNode } from 'react'

export function NoticeToggle({ notice }: { notice: string }) {
  const [open, setOpen] = useState(false)
  if (!notice.trim()) return null
  return (
    <section className="block">
      <button
        type="button"
        className="toggle-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="toggle-chevron">{open ? '▾' : '▸'}</span>
        처음이라면
      </button>
      {open ? <p className="notice-body">{notice}</p> : null}
    </section>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>
}

export function BandCard({
  bandName,
  faceName,
  coverUrl,
  faceUrl,
}: {
  bandName: string
  faceName: string
  coverUrl: string | null
  faceUrl: string | null
}) {
  const photos = [
    coverUrl ? { src: coverUrl, alt: `${bandName || 'band'} cover` } : null,
    faceUrl ? { src: faceUrl, alt: `${faceName || 'face'} photo` } : null,
  ].filter(Boolean) as { src: string; alt: string }[]

  return (
    <article className="band-card">
      {(bandName || faceName) && (
        <div className="band-meta">
          {bandName ? (
            <p>
              <span className="label">밴드명</span> {bandName}
            </p>
          ) : null}
          {faceName ? (
            <p>
              <span className="label">낯</span> {faceName}
            </p>
          ) : null}
        </div>
      )}
      {photos.length > 0 ? (
        <div className={`photo-row${photos.length === 1 ? ' photo-row-one' : ''}`}>
          {photos.map((p) => (
            <figure key={p.src} className="photo-slot">
              <img src={p.src} alt={p.alt} />
            </figure>
          ))}
        </div>
      ) : null}
    </article>
  )
}
