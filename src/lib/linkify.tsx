import type { ReactNode } from 'react'

const TOKEN_RE =
  /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|@[a-zA-Z0-9_]{1,30})/g

function trimTrailingPunctuation(token: string): { core: string; trail: string } {
  const match = token.match(/^(.*?)([),.!?;:]+)$/)
  if (!match) return { core: token, trail: '' }
  return { core: match[1], trail: match[2] }
}

function hrefFor(token: string): string | null {
  if (token.startsWith('http://') || token.startsWith('https://')) return token
  if (token.startsWith('www.')) return `https://${token}`
  if (token.startsWith('@')) return `https://x.com/${token.slice(1)}`
  return null
}

/** Turn URLs and @handles in plain text into clickable links. */
export function linkifyText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0
  const re = new RegExp(TOKEN_RE.source, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index))
    }
    const { core, trail } = trimTrailingPunctuation(match[0])
    const href = hrefFor(core)
    if (href) {
      nodes.push(
        <a key={`l${key++}`} href={href} target="_blank" rel="noopener noreferrer" className="inline-link">
          {core}
        </a>,
      )
      if (trail) nodes.push(trail)
    } else {
      nodes.push(match[0])
    }
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}
