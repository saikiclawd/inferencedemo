import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { booksApi, type Book } from '../api/books.ts'
import BookCard from '../components/BookCard.tsx'

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Mystery', 'Biography', 'Technology', 'Self-Help', 'History']

export default function Home() {
  const [bestsellers, setBestsellers] = useState<Book[]>([])
  const [featured, setFeatured] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      booksApi.getBestsellers(),
      booksApi.getBooks({ pageSize: 8 }),
    ]).then(([bs, feat]) => {
      setBestsellers(bs.data.data.slice(0, 6))
      setFeatured(feat.data.data)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <section className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Discover Your Next Great Read</h1>
        <p className="text-brand-100 mb-6">Thousands of books, one click away. Powered by Akamai.</p>
        <Link
          to="/browse"
          className="inline-block bg-white text-brand-600 font-semibold px-6 py-3 rounded-full hover:bg-brand-50 transition-colors"
        >
          Browse Catalog
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/browse?category=${encodeURIComponent(cat)}`}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center font-medium text-gray-700 hover:border-brand-400 hover:text-brand-600 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {bestsellers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Best Sellers</h2>
            <Link to="/browse" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl aspect-[2/3] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {bestsellers.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          )}
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">New Arrivals</h2>
          <Link to="/browse" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl aspect-[2/3] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {featured.map((book) => <BookCard key={book.id} book={book} />)}
          </div>
        )}
      </section>
    </div>
  )
}
