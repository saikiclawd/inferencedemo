import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '../store/cart.store.ts'
import { useAuthStore } from '../store/auth.store.ts'
import toast from 'react-hot-toast'

export default function Cart() {
  const { items, loading, fetchCart, updateItem, removeItem } = useCartStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) fetchCart()
  }, [isAuthenticated])

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Sign in to view your cart.</p>
        <Link to="/" className="text-brand-600 hover:underline">← Back to Home</Link>
      </div>
    )
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl mb-2">🛒</p>
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <Link to="/browse" className="text-brand-600 hover:underline">Continue Shopping</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 bg-white border border-gray-200 rounded-xl p-4">
            <img
              src={item.cover_url || `https://placehold.co/60x90/e5e7eb/6b7280?text=Book`}
              alt={item.title}
              className="w-16 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-gray-500">{item.author}</p>
              <p className="font-bold text-brand-600 mt-1">${(item.price * item.quantity).toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => item.quantity > 1 && updateItem(item.book_id, item.quantity - 1)}
                  className="p-1 border rounded hover:bg-gray-50"
                >
                  <MinusIcon className="w-3 h-3" />
                </button>
                <span className="text-sm w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateItem(item.book_id, item.quantity + 1)}
                  className="p-1 border rounded hover:bg-gray-50"
                >
                  <PlusIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
            <button
              onClick={() => removeItem(item.book_id).then(() => toast.success('Removed'))}
              className="self-start p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-bold text-lg">${total.toFixed(2)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-brand-500 text-white py-3 rounded-full font-semibold hover:bg-brand-600 transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}
