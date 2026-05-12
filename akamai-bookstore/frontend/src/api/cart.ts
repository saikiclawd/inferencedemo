import api from './axios.ts'
import type { CartItem } from '../store/cart.store.ts'

export const cartApi = {
  getCart: () => api.get<{ data: CartItem[] }>('/api/cart'),

  addItem: (bookId: string, quantity: number, price: number) =>
    api.post('/api/cart', { bookId, quantity, price }),

  updateItem: (bookId: string, quantity: number) =>
    api.put('/api/cart', { bookId, quantity }),

  removeItem: (bookId: string) => api.delete(`/api/cart/${bookId}`),

  mergeCart: (items: { bookId: string; quantity: number }[]) =>
    api.post('/api/cart/merge', items),
}
