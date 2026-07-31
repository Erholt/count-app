import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/api'

function Signup() {
  const [username, setUsername] = useState()
  const [email, setEmail]       = useState()
  const [password, setPassword] = useState()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    api.post('/signup', { username, email, password })
      .then((response) => {
        console.log('Signup successful:', response.data)
        navigate('/login')
      })
      .catch((error) => {
        console.error('Signup error:', error)
      })
  }

  return (
    <div>
      <h1>Signup</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          autoComplete='username'
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          autoComplete='email'
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          autoComplete='current-password'
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Signup</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}

export default Signup