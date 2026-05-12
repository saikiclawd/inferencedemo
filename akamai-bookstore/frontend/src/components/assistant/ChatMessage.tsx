import { parseBookBlocks } from './parseBookBlocks.ts'
import type { ChatMessage } from '../../store/assistant.store.ts'
import { booksApi, type Book } from '../../api/books.ts'
import { useEffect, useState } from 'react'
import BookCard from '../BookCard.tsx'

interface Props {
  message: ChatMessage
}

function BookBlockRenderer({ ids }: { ids: string[] }) {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    Promise.all(ids.map((id) => booksApi.getBook(id).then((r) => r.data.data).catch(() => null)))
      .then((results) => setBooks(results.filter(Boolean) as Book[]))
  }, [ids])

  if (books.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-2 mt-2">
      {books.map((book) => (
        <BookCard key={book.id} book={book} compact />
      ))}
    </div>
  )
}

export default function ChatMessageComponent({ message }: Props) {
  const isUser = message.role === 'user'
  const segments = parseBookBlocks(message.content)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1 mr-2">
          B
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
          isUser
            ? 'bg-brand-500 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {segments.map((seg, i) =>
          seg.type === 'text' ? (
            <p key={i} className="whitespace-pre-wrap leading-relaxed">
              {seg.content}
              {message.isStreaming && i === segments.length - 1 && (
                <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 animate-pulse" />
              )}
            </p>
          ) : (
            <BookBlockRenderer key={i} ids={seg.ids} />
          ),
        )}
        {message.isStreaming && message.content === '' && (
          <span className="flex gap-1 items-center h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
          </span>
        )}
      </div>
    </div>
  )
}
