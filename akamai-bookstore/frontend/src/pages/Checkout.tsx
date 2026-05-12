import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cart.store.ts'
import toast from 'react-hot-toast'

export default function Checkout() {
  const { items, checkout } = useCartStore()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      const orderId = await checkout()
      toast.success('Order placed successfully!')
      navigate(`/orders?new=${orderId}`)
    } catch {
      toast.error('Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-700">{item.title} × {item.quantity}</span>
            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <hr />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span className="text-brand-600">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
        This is a demo store. No real payment is processed.
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="w-full bg-brand-500 text-white py-3 rounded-full font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </div>
  )
}
