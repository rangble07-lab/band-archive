import { useState, type ReactNode } from 'react'
import { isNoticeEmpty, sanitizeNoticeHtml } from '../lib/richtext'

export function NoticeToggle({ notice }: { notice: string }) {
  const [open, setOpen] = useState(false)
  const html = sanitizeNoticeHtml(notice)
  if (isNoticeEmpty(html)) return null
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
      {open ? (
        <div className="notice-body" dangerouslySetInnerHTML={{ __html: html }} />
      ) : null}
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
  const cover = Boolean(coverUrl || bandName.trim())
  const face = Boolean(faceUrl || faceName.trim())
  const count = (cover ? 1 : 0) + (face ? 1 : 0)
  if (count === 0) return null

  return (
    <article className="band-card">
      <div className={`photo-row${count === 1 ? ' photo-row-one' : ''}`}>
        {cover ? (
          <figure className="photo-slot">
            {coverUrl ? (
              <img src={coverUrl} alt={bandName.trim() || '밴드 커버'} />
            ) : (
              <div className="photo-empty" aria-hidden="true" />
            )}
            {bandName.trim() ? <figcaption>{bandName}</figcaption> : null}
          </figure>
        ) : null}
        {face ? (
          <figure className="photo-slot">
            {faceUrl ? (
              <img src={faceUrl} alt={faceName.trim() || '낯'} />
            ) : (
              <div className="photo-empty" aria-hidden="true" />
            )}
            {faceName.trim() ? <figcaption>{faceName}</figcaption> : null}
          </figure>
        ) : null}
      </div>
    </article>
  )
}
