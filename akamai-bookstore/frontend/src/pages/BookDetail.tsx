import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { StarIcon, ShoppingCartIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'
import { booksApi, type Book } from '../api/books.ts'
import { useCartStore } from '../store/cart.store.ts'
import { useAuthStore } from '../store/auth.store.ts'
import BookCard from '../components/BookCard.tsx'
import toast from 'react-hot-toast'
import keycloak from '../keycloak.ts'

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [recommendations, setRecommendations] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  const addItem = useCartStore((s) => s.addItem)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      booksApi.getBook(id),
      booksApi.getBookRecommendations(id),
    ]).then(([bookRes, recsRes]) => {
      setBook(bookRes.data.data)
      setRecommendations(recsRes.data.data)
    }).finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = async () => {
    if (!isAuthenticated) { keycloak.login(); return }
    if (!book) return
    try {
      await addItem(book.id, 1, book.price)
      toast.success(`"${book.title}" added to cart`)
    } catch {
      toast.error('Failed to add to cart')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="flex gap-8">
          <div className="w-56 aspect-[2/3] bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!book) return <div className="text-center py-16 text-gray-500">Book not found.</div>

  const stars = Math.round(book.rating)
  const coverFallback = `https://placehold.co/280x420/e5e7eb/6b7280?text=${encodeURIComponent(book.title.slice(0, 10))}`

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Browse
      </Link>

      <div className="flex flex-col sm:flex-row gap-8">
        <img
          src={book.cover_url || coverFallback}
          alt={book.title}
          className="w-56 self-start rounded-xl shadow-lg"
          onError={(e) => { (e.target as HTMLImageElement).src = coverFallback }}
        />

        <div className="flex-1">
          <span className="text-xs font-medium bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full">
            {book.category}
          </span>
          <h1 className="text-2xl font-bold mt-3 mb-1">{book.title}</h1>
          <p className="text-gray-500 mb-3">by {book.author}</p>

          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} className={`w-5 h-5 ${i < stars ? 'text-amber-400' : 'text-gray-200'}`} />
            ))}
            <span className="text-sm text-gray-500 ml-1">{book.rating.toFixed(1)}</span>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{book.description}</p>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-brand-600">${book.price.toFixed(2)}</span>
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-full hover:bg-brand-600 transition-colors font-medium"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              Add to Cart
            </button>
          </div>

          <p className="text-sm text-gray-400 mt-3">
            {book.quantity > 0 ? `${book.quantity} in stock` : 'Out of stock'}
          </p>
        </div>
      </div>

      {recommendations.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">You Might Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendations.map((rec) => <BookCard key={rec.id} book={rec} />)}
          </div>
        </section>
      )}
    </div>
  )
}
