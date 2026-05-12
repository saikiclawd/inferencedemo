export type TextSegment = { type: 'text'; content: string }
export type BookBlock = { type: 'books'; ids: string[] }
export type MessageSegment = TextSegment | BookBlock

const BLOCK_REGEX = /\[BOOKS\]([\s\S]*?)\[\/BOOKS\]/g

export function parseBookBlocks(text: string): MessageSegment[] {
  const segments: MessageSegment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(BLOCK_REGEX)) {
    if (match.index! > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    try {
      const parsed = JSON.parse(match[1].trim()) as { ids: string[] }
      if (Array.isArray(parsed.ids)) {
        segments.push({ type: 'books', ids: parsed.ids })
      }
    } catch {
      segments.push({ type: 'text', content: match[0] })
    }

    lastIndex = match.index! + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments
}
