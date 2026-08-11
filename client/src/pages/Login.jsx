import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/api'

function Login() {
  const [email, setEmail]       = useState()
  const [password, setPassword] = useState()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    api.post('/login', { email, password })
      .then((response) => {
        if (response.status === 200) {
          window.dispatchEvent(new Event('auth-change'))
          navigate('/')
        }
      })
      .catch((error) => {
        console.error('Login error:', error.response?.data || error.message)
      })
  }

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default Login;