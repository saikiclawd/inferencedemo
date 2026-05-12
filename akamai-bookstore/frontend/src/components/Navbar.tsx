import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCartIcon, MagnifyingGlassIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/auth.store.ts'
import { useCartStore } from '../store/cart.store.ts'
import keycloak from '../keycloak.ts'
import { useState } from 'react'

export default function Navbar() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const cartItems = useCartStore((s) => s.items)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-brand-600 text-lg shrink-0">
          <BookOpenIcon className="w-7 h-7" />
          <span className="hidden sm:block">Akamai Bookstore</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, authors, genres..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </form>

        <div className="flex items-center gap-3 ml-auto shrink-0">
          <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full">
            <ShoppingCartIcon className="w-6 h-6 text-gray-700" />
            {cartItems.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartItems.length}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/orders" className="text-sm text-gray-600 hover:text-brand-600">
                Orders
              </Link>
              <button
                onClick={() => keycloak.logout()}
                className="text-sm text-gray-600 hover:text-brand-600"
              >
                {(user?.preferred_username as string) ?? 'Sign out'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => keycloak.login()}
              className="bg-brand-500 text-white text-sm px-4 py-2 rounded-full hover:bg-brand-600 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
