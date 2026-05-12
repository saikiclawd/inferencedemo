import { useEffect, useState } from 'react'
import { ordersApi, type Order } from '../api/orders.ts'
import { useAuthStore } from '../store/auth.store.ts'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return
    ordersApi.getOrders().then((r) => setOrders(r.data.data)).finally(() => setLoading(false))
  }, [isAuthenticated])

  if (!isAuthenticated) return <div className="text-center py-16 text-gray-500">Please sign in.</div>

  if (loading) return <div className="text-center py-16 text-gray-400 animate-pulse">Loading orders…</div>

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl mb-2">📦</p>
        <p className="text-gray-500">No orders yet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-gray-400">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm text-gray-500">{new Date(order.order_date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
                <p className="font-bold text-brand-600 mt-1">${order.total.toFixed(2)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.bookId} className="flex gap-3 text-sm">
                  <img
                    src={item.cover_url || `https://placehold.co/40x60/e5e7eb/6b7280?text=Book`}
                    alt={item.title}
                    className="w-10 h-14 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-gray-500">{item.author} × {item.quantity}</p>
                    <p className="text-brand-600">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
