import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { booksApi, type Book } from '../api/books.ts'
import BookCard from '../components/BookCard.tsx'

export default function Search() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [results, setResults] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    booksApi.search(q)
      .then((r) => {
        setResults(r.data.data)
        setTotal(r.data.total)
      })
      .finally(() => setLoading(false))
  }, [q])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-xl font-bold mb-2">
        Search results for <span className="text-brand-600">"{q}"</span>
      </h1>
      <p className="text-sm text-gray-500 mb-6">{total} results found</p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl aspect-[2/3] animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-2xl mb-2">🔍</p>
          <p>No books found for "{q}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      )}
    </div>
  )
}
