const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'P', 'DIV'])

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? '')
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName.toUpperCase()
  if (tag === 'BR') return '<br>'

  const inner = Array.from(el.childNodes).map(serializeNode).join('')
  if (!ALLOWED.has(tag)) return inner

  if (tag === 'STRONG' || tag === 'B') return inner ? `<b>${inner}</b>` : ''
  if (tag === 'EM' || tag === 'I') return inner ? `<i>${inner}</i>` : ''
  if (tag === 'U') return inner ? `<u>${inner}</u>` : ''
  if (tag === 'P' || tag === 'DIV') {
    if (!inner) return ''
    // Keep line breaks between blocks without nesting junk
    return `${inner}<br>`
  }
  return inner
}

/** Keep only bold / italic / underline / line breaks. */
export function sanitizeNoticeHtml(input: string): string {
  const raw = input ?? ''
  if (!raw.trim()) return ''

  let html = raw
  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    html = escapeHtml(raw).replace(/\r\n|\r|\n/g, '<br>')
  }

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''

  let out = Array.from(root.childNodes).map(serializeNode).join('')
  out = out.replace(/(?:<br>\s*)+$/g, '').replace(/^(?:<br>\s*)+/g, '')
  return out
}

export function noticePlainText(html: string): string {
  const sanitized = sanitizeNoticeHtml(html)
  if (!sanitized) return ''
  const doc = new DOMParser().parseFromString(`<div>${sanitized}</div>`, 'text/html')
  return (doc.body.textContent ?? '').replace(/\u00a0/g, ' ').trim()
}

export function isNoticeEmpty(html: string): boolean {
  return !noticePlainText(html)
}
