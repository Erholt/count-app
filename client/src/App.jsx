import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import api from '@/api'

import Header  from './components/Header'

import Home    from './pages/Home'
import Signup  from './pages/Signup'
import Login   from './pages/Login'
import Test    from './pages/Test'
import Test2   from './pages/Test2'
import NoMatch from './pages/404'

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)

  useEffect(() => {
    api.get('/verify-token')
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
  }, [])

  if (isAuthenticated === null) {
    return null
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ textAlign: 'center' }}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/test" element={<ProtectedRoute><Test /></ProtectedRoute>} />
          <Route path="/test2" element={<ProtectedRoute><Test2 /></ProtectedRoute>} />

          <Route path="*" element={<NoMatch />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
