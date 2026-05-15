import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar.tsx'
import BookBot from './components/assistant/BookBot.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import Home from './pages/Home.tsx'
import Browse from './pages/Browse.tsx'
import BookDetail from './pages/BookDetail.tsx'
import Cart from './pages/Cart.tsx'
import Checkout from './pages/Checkout.tsx'
import Orders from './pages/Orders.tsx'
import Search from './pages/Search.tsx'

export default function App() {
  const aiEnabled = import.meta.env.VITE_ENABLE_AI === 'true'

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
        </Routes>
        {aiEnabled ? <BookBot /> : null}
        <Toaster position="bottom-left" />
      </div>
    </BrowserRouter>
  )
}
