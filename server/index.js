const bcrypt   = require('bcrypt')
const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const env      = require('dotenv')
const path     = require('path')
const jwt      = require('jsonwebtoken')

const UserModel = require('./models/User')
const GameModel = require('./models/Game')

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

const router = require('express').Router()

function extractTokenFromRequest(req) {
  try {
    const authHeader = req.headers.authorization || ''
    const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

    const cookies = req.headers.cookie || ''
    const cookieToken = cookies
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('token='))
      ?.split('=')[1]

    return headerToken || decodeURIComponent(cookieToken || '')
  } catch (e) {
    return ''
  }
}

router.get('/verify-token', (req, res) => {
  try {
    const token = extractTokenFromRequest(req)

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    return res.status(200).json({ valid: true, user: decoded })
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  return res.status(200).json({ message: 'Logged out successfully' })
})

// Login route
router.post('/login', async (req, res) => {
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
router.post("/signup", async (req, res) => {
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

// Games endpoints
router.get('/games', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    const userId = decoded.id

    // Only return games owned/created by this user
    const games = await GameModel.find({ createdBy: userId })
    return res.status(200).json(games)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error fetching games' })
  }
})

router.post('/games', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    const userId = decoded.id

    const { name, scoring = 'low', targetScore } = req.body || {}

    if (!name) return res.status(400).json({ message: 'Name is required' })

    // create game with the owner as the initial player (store name only)
    const username = decoded.username || 'Owner'
    const newGame = await GameModel.create({
      name,
      scoring: scoring === 'high' ? 'high' : 'low',
      targetScore: targetScore ? Number(targetScore) : undefined,
      players: [{ name: username, score: 0 }],
      createdBy: userId,
    })

    return res.status(201).json(newGame)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error creating game' })
  }
})

// Get winner for a game (returns null when no winner yet or no targetScore)
router.get('/games/:id/winner', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    const userId = decoded.id

    const game = await GameModel.findById(req.params.id)
    if (!game) return res.status(404).json({ message: 'Game not found' })
    if (String(game.createdBy) !== String(userId)) return res.status(403).json({ message: 'Forbidden' })

    if (game.status === 'completed') return res.status(400).json({ message: 'Cannot modify a completed game' })

    if (game.status === 'completed') return res.status(400).json({ message: 'Game is already completed' })

    const winner = game.getWinner()
    return res.status(200).json({ winner })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error getting winner' })
  }
})

// Add a player (by name) to a game. Only the owner can add players.
router.post('/games/:id/players', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    const userId = decoded.id

    const { name } = req.body || {}
    if (!name) return res.status(400).json({ message: 'Player name is required' })

    const game = await GameModel.findById(req.params.id)
    if (!game) return res.status(404).json({ message: 'Game not found' })
    if (String(game.createdBy) !== String(userId)) return res.status(403).json({ message: 'Forbidden' })

    if (game.status === 'completed') return res.status(400).json({ message: 'Cannot modify a completed game' })

    // append player
    game.players.push({ name: String(name), score: 0 })
    await game.save()

    return res.status(200).json(game)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error adding player' })
  }
})

// Remove a player by player id. Owner-only.
router.delete('/games/:id/players/:playerId', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    const userId = decoded.id

    const { id: gameId, playerId } = req.params
    const game = await GameModel.findById(gameId)
    if (!game) return res.status(404).json({ message: 'Game not found' })
    if (String(game.createdBy) !== String(userId)) return res.status(403).json({ message: 'Forbidden' })

    if (game.status === 'completed') return res.status(400).json({ message: 'Cannot modify a completed game' })

    if (game.status === 'completed') return res.status(400).json({ message: 'Cannot modify a completed game' })

    // find and remove player
    const before = game.players.length
    game.players = (game.players || []).filter(p => String(p._id) !== String(playerId))
    if (game.players.length === before) {
      return res.status(404).json({ message: 'Player not found' })
    }

    await game.save()
    return res.status(200).json(game)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error removing player' })
  }
})

// Update player (rename). Owner-only.
router.patch('/games/:id/players/:playerId', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    const userId = decoded.id

    const { id: gameId, playerId } = req.params
    const { name } = req.body || {}

    if (!name || typeof name !== 'string') return res.status(400).json({ message: 'Name is required' })

    const game = await GameModel.findById(gameId)
    if (!game) return res.status(404).json({ message: 'Game not found' })
    if (String(game.createdBy) !== String(userId)) return res.status(403).json({ message: 'Forbidden' })
    if (game.status === 'completed') return res.status(400).json({ message: 'Cannot modify a completed game' })

    const player = (game.players || []).id(playerId)
    if (!player) return res.status(404).json({ message: 'Player not found' })

    player.name = String(name)
    await game.save()
    return res.status(200).json(game)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error renaming player' })
  }
})

// Update a player's score. Accepts { delta } to add/subtract or { score } to set absolute value.
router.patch('/games/:id/players/:playerId/score', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    const userId = decoded.id

    const { id: gameId, playerId } = req.params
    const { delta, score } = req.body || {}

    const game = await GameModel.findById(gameId)
    if (!game) return res.status(404).json({ message: 'Game not found' })
    if (String(game.createdBy) !== String(userId)) return res.status(403).json({ message: 'Forbidden' })

    const player = (game.players || []).id(playerId)
    if (!player) return res.status(404).json({ message: 'Player not found' })

    if (typeof score === 'number') {
      player.score = score
    } else if (typeof delta === 'number') {
      player.score = (typeof player.score === 'number' ? player.score : 0) + delta
    } else {
      return res.status(400).json({ message: 'Provide either numeric delta or score' })
    }

    await game.save()
    return res.status(200).json(game)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error updating player score' })
  }
})

// Finish a game prematurely. Optional body: { winnerName } to explicitly set winner.
// If no winnerName provided, server will compute a winner: if game.targetScore exists use that logic,
// otherwise compute based on scoring (force) so finishing picks the best according to scoring rule.
router.post('/games/:id/finish', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    const userId = decoded.id

    const { winnerName } = req.body || {}

    const game = await GameModel.findById(req.params.id)
    if (!game) return res.status(404).json({ message: 'Game not found' })
    if (String(game.createdBy) !== String(userId)) return res.status(403).json({ message: 'Forbidden' })

    let winner = null
    if (winnerName) {
      const p = (game.players || []).find(p => p.name === winnerName)
      if (p) winner = { name: p.name, score: p.score }
      else return res.status(400).json({ message: 'Winner name not found among players' })
    } else {
      // compute winner; if no targetScore this will compute based on scoring
      winner = game.computeWinner({ force: true })
    }

    game.status = 'completed'
    if (winner) {
      game.winner = { name: winner.name, score: winner.score, decidedAt: new Date() }
    }

    await game.save()
    return res.status(200).json(game)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error finishing game' })
  }
})

// Update game settings (scoring, targetScore, name). Owner-only.
router.patch('/games/:id', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    const userId = decoded.id

    const { scoring, targetScore, name } = req.body || {}

    const game = await GameModel.findById(req.params.id)
    if (!game) return res.status(404).json({ message: 'Game not found' })
    if (String(game.createdBy) !== String(userId)) return res.status(403).json({ message: 'Forbidden' })

    if (scoring && ['low', 'high'].includes(scoring)) game.scoring = scoring
    if (typeof targetScore !== 'undefined') game.targetScore = targetScore === null ? undefined : Number(targetScore)
    if (typeof name === 'string' && name.trim()) game.name = name.trim()

    await game.save()
    return res.status(200).json(game)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error updating game' })
  }
})

const port = process.env.PORT || 3001
app.use('/api', router)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
