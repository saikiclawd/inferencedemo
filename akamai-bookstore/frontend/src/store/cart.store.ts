import { create } from 'zustand'
import { cartApi } from '../api/cart.ts'
import { ordersApi } from '../api/orders.ts'

export interface CartItem {
  id: string
  book_id: string
  title: string
  author: string
  cover_url: string
  quantity: number
  price: number
}

interface CartState {
  items: CartItem[]
  loading: boolean
  fetchCart: () => Promise<void>
  addItem: (bookId: string, quantity: number, price: number) => Promise<void>
  updateItem: (bookId: string, quantity: number) => Promise<void>
  removeItem: (bookId: string) => Promise<void>
  checkout: () => Promise<string>
  clear: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,

  fetchCart: async () => {
    set({ loading: true })
    try {
      const { data } = await cartApi.getCart()
      set({ items: data.data })
    } finally {
      set({ loading: false })
    }
  },

  addItem: async (bookId, quantity, price) => {
    await cartApi.addItem(bookId, quantity, price)
    await get().fetchCart()
  },

  updateItem: async (bookId, quantity) => {
    await cartApi.updateItem(bookId, quantity)
    await get().fetchCart()
  },

  removeItem: async (bookId) => {
    await cartApi.removeItem(bookId)
    await get().fetchCart()
  },

  checkout: async () => {
    const { data } = await ordersApi.createOrder()
    set({ items: [] })
    return data.data.orderId
  },

  clear: () => set({ items: [] }),
}))
