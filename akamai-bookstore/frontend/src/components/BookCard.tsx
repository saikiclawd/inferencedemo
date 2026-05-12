import { StarIcon, ShoppingCartIcon } from '@heroicons/react/24/solid'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import type { Book } from '../api/books.ts'
import { useCartStore } from '../store/cart.store.ts'
import { useAuthStore } from '../store/auth.store.ts'
import toast from 'react-hot-toast'
import keycloak from '../keycloak.ts'

interface BookCardProps {
  book: Book
  compact?: boolean
}

export default function BookCard({ book, compact = false }: BookCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      keycloak.login()
      return
    }
    try {
      await addItem(book.id, 1, book.price)
      toast.success(`"${book.title}" added to cart`)
    } catch {
      toast.error('Failed to add to cart')
    }
  }

  const stars = Math.round(book.rating)
  const coverFallback = `https://placehold.co/200x300/e5e7eb/6b7280?text=${encodeURIComponent(book.title.slice(0, 10))}`

  if (compact) {
    return (
      <div className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
        <img
          src={book.cover_url || coverFallback}
          alt={book.title}
          className="w-12 h-16 object-cover rounded flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).src = coverFallback }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{book.title}</p>
          <p className="text-xs text-gray-500 truncate">{book.author}</p>
          <p className="text-sm font-bold text-brand-600 mt-1">${book.price.toFixed(2)}</p>
          <button
            onClick={handleAddToCart}
            className="mt-1 text-xs bg-brand-500 text-white px-2 py-1 rounded hover:bg-brand-600 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    )
  }

  return (
    <Link
      to={`/books/${book.id}`}
      className="group flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden">
        <img
          src={book.cover_url || coverFallback}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = coverFallback }}
        />
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="font-semibold text-sm line-clamp-2 mb-1">{book.title}</p>
        <p className="text-xs text-gray-500 mb-2">{book.author}</p>
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              className={clsx(
                'w-3.5 h-3.5',
                i < stars ? 'text-amber-400' : 'text-gray-200',
              )}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">{book.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-brand-600">${book.price.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1 text-xs bg-brand-500 text-white px-2 py-1.5 rounded-lg hover:bg-brand-600 transition-colors"
          >
            <ShoppingCartIcon className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </Link>
  )
}
