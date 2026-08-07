import { useEffect, useRef } from 'react'
import { sanitizeNoticeHtml } from '../lib/richtext'

export function NoticeEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef(value)
  const primed = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const next = sanitizeNoticeHtml(value)
    if (!primed.current) {
      el.innerHTML = next || ''
      lastEmitted.current = value
      primed.current = true
      return
    }
    if (value === lastEmitted.current) return
    if (el.innerHTML !== next) {
      el.innerHTML = next || ''
    }
    lastEmitted.current = value
  }, [value])

  function emit() {
    const el = ref.current
    if (!el) return
    const html = sanitizeNoticeHtml(el.innerHTML)
    lastEmitted.current = html
    onChange(html)
  }

  function format(command: 'bold' | 'italic' | 'underline') {
    const el = ref.current
    if (!el) return
    el.focus()
    document.execCommand(command, false)
    emit()
  }

  return (
    <div className="notice-editor">
      <div className="format-bar" role="toolbar" aria-label="글자 서식">
        <button
          type="button"
          className="format-btn"
          title="굵게"
          onMouseDown={(e) => {
            e.preventDefault()
            format('bold')
          }}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className="format-btn"
          title="기울임"
          onMouseDown={(e) => {
            e.preventDefault()
            format('italic')
          }}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className="format-btn"
          title="밑줄"
          onMouseDown={(e) => {
            e.preventDefault()
            format('underline')
          }}
        >
          <u>U</u>
        </button>
      </div>
      <div
        ref={ref}
        className="rich-input"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder ?? ''}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
      />
    </div>
  )
}
