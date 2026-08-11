const bcrypt   = require('bcrypt')
const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const env      = require('dotenv')
const path     = require('path')
const jwt      = require('jsonwebtoken')

const UserModel = require('./models/User')

const app = express()
app.use(express.json())
env.config({ path: path.resolve(__dirname, '../config.env') })

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173'].filter(Boolean)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

mongoose.connect(`mongodb+srv://jacob_db_user:${process.env.DB_PASSWORD}@cluster0.fyomuba.mongodb.net/?appName=Cluster0`)

app.get('/verify-token', (req, res) => {
  try {
    const authHeader = req.headers.authorization || ''
    const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

    const cookies = req.headers.cookie || ''
    const cookieToken = cookies
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('token='))
      ?.split('=')[1]

    const token = headerToken || decodeURIComponent(cookieToken || '')

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    return res.status(200).json({ valid: true, user: decoded })
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
})

app.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  return res.status(200).json({ message: 'Logged out successfully' })
})

// Login route
app.post('/login', async (req, res) => {
  try {
    const body     = req.body || {}
    const email    = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await UserModel.findOne({ email })

    if (!user) {
      return res.status(401).json({ message: 'No user found with that email' })
    }

    let validPassword = false

    if (typeof user.password === 'string') {
      validPassword = await bcrypt.compare(password, user.password).catch(() => false)
      if (!validPassword && user.password === password) {
        validPassword = true
      }
    }

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.TOKEN_SECRET,
      { algorithm: 'HS256', expiresIn: 1800 }
    )

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 1800 * 1000,
      sameSite: 'lax',
      path: '/'
    })
    return res.status(200).json({ status: 200, message: 'Login successful', user, token })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error logging in', error: error.message })
  }
})

// Signup route
app.post("/signup", async (req, res) => {
  try {
    const body = req.body;

    if (!(body.username && body.password)) {
      return res.status(400).send({ error: "Data not formatted properly" });
    }

    const user = await UserModel.create(req.body);
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    res.status(201).send(user);

  } catch (error) {
    res.status(500).json({ message: "Error creating User" });
  }
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
