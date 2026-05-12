import api from './axios.ts'

export interface Book {
  id: string
  title: string
  author: string
  category: string
  description?: string
  price: number
  rating: number
  cover_url: string
  quantity: number
  similarity?: number
}

export interface BooksResponse {
  data: Book[]
  total: number
  page: number
  pageSize: number
}

export const booksApi = {
  getBooks: (params?: { page?: number; pageSize?: number; category?: string }) =>
    api.get<BooksResponse>('/api/books', { params }),

  getBook: (id: string) => api.get<{ data: Book }>(`/api/books/${id}`),

  getBestsellers: () => api.get<{ data: Book[] }>('/api/bestsellers'),

  search: (q: string, params?: { category?: string; page?: number; sort?: string }) =>
    api.get<BooksResponse>('/api/search', { params: { q, ...params } }),

  getRecommendations: () => api.get<{ data: Book[] }>('/api/recommendations'),

  getBookRecommendations: (bookId: string) =>
    api.get<{ data: Book[] }>(`/api/recommendations/${bookId}`),
}
