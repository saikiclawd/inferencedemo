import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { booksApi, type Book } from '../api/books.ts'
import BookCard from '../components/BookCard.tsx'

const CATEGORIES = ['All', 'Fiction', 'Non-Fiction', 'Sci-Fi', 'Mystery', 'Biography', 'Technology', 'Self-Help', 'History']

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')

  const [books, setBooks] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pageSize = 20

  useEffect(() => {
    setLoading(true)
    booksApi.getBooks({ category: category || undefined, page, pageSize })
      .then((r) => {
        setBooks(r.data.data)
        setTotal(r.data.total)
      })
      .finally(() => setLoading(false))
  }, [category, page])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
      <aside className="w-48 shrink-0 hidden sm:block">
        <h2 className="font-semibold mb-3 text-gray-700">Category</h2>
        <ul className="space-y-1">
          {CATEGORIES.map((cat) => {
            const active = cat === 'All' ? !category : category === cat
            return (
              <li key={cat}>
                <button
                  onClick={() => setSearchParams(cat === 'All' ? {} : { category: cat })}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-brand-100 text-brand-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <main className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">{category || 'All Books'}</h1>
          <span className="text-sm text-gray-500">{total} books</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl aspect-[2/3] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {books.map((book) => <BookCard key={book.id} book={book} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setSearchParams({ ...(category ? { category } : {}), page: String(page - 1) })}
                  disabled={page <= 1}
                  className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setSearchParams({ ...(category ? { category } : {}), page: String(page + 1) })}
                  disabled={page >= totalPages}
                  className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
