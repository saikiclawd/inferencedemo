import api from './axios.ts'

export interface Order {
  id: string
  order_date: string
  total: number
  status: string
  items: {
    bookId: string
    title: string
    author: string
    cover_url: string
    quantity: number
    price: number
  }[]
}

export const ordersApi = {
  getOrders: () => api.get<{ data: Order[] }>('/api/orders'),
  createOrder: () => api.post<{ data: { orderId: string; total: number } }>('/api/orders'),
}
