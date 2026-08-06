import { useState, type ReactNode } from 'react'

export function NoticeToggle({ notice }: { notice: string }) {
  const [open, setOpen] = useState(false)
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
      {open ? <p className="notice-body">{notice || '—'}</p> : null}
    </section>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>
}

export function BandCard({
  bandName,
  faceName,
  handle,
  coverUrl,
  faceUrl,
}: {
  bandName: string
  faceName: string
  handle: string
  coverUrl: string | null
  faceUrl: string | null
}) {
  return (
    <article className="band-card">
      <div className="band-meta">
        <p>
          <span className="label">밴드명</span> {bandName || '________'}
        </p>
        <p>
          <span className="label">낯</span> {faceName || '________'}
        </p>
        <p>
          <span className="label">@</span> {handle || '_____'}
        </p>
      </div>
      <div className="photo-row">
        <figure className="photo-slot">
          {coverUrl ? (
            <img src={coverUrl} alt={`${bandName || 'band'} cover`} />
          ) : (
            <div className="photo-empty">커버</div>
          )}
          <figcaption>커버</figcaption>
        </figure>
        <figure className="photo-slot">
          {faceUrl ? (
            <img src={faceUrl} alt={`${faceName || 'face'} photo`} />
          ) : (
            <div className="photo-empty">낯</div>
          )}
          <figcaption>낯</figcaption>
        </figure>
      </div>
    </article>
  )
}
