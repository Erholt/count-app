const mongoose = require('mongoose')

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  score: { type: Number, default: 0 }
})

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  scoring: { type: String, enum: ['low', 'high'], default: 'low' },
  targetScore: { type: Number },
  players: { type: [playerSchema], default: [] },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  winner: {
    name: { type: String },
    score: { type: Number },
    decidedAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now }
})

// Return the winning player when a winner condition exists.
// Behavior: if no `targetScore` is set, return null (no automatic winner).
// If `targetScore` is set, find players with score >= target. If none, return null.
// If one or more, pick the player with the highest score (tie-breaker: first found).
// Return the winning player when a winner condition exists (based on targetScore).
gameSchema.methods.getWinner = function getWinner() {
  if (!this.targetScore) return null

  const reached = (this.players || []).filter(p => typeof p.score === 'number' && p.score >= this.targetScore)
  if (!reached.length) return null

  // choose player with highest score among those who reached target
  let winner = reached[0]
  for (let i = 1; i < reached.length; i++) {
    if (reached[i].score > winner.score) winner = reached[i]
  }
  return winner
}

// Compute a winner based on current scores. If `force` is false and there's no targetScore,
// returns null. If `force` is true, choose winner by `scoring` rule (low => lowest score, high => highest score).
gameSchema.methods.computeWinner = function computeWinner({ force = false } = {}) {
  if (!this.targetScore && !force) return null

  if (this.targetScore) {
    const w = this.getWinner()
    return w ? { name: w.name, score: w.score } : null
  }

  // force mode or target not required: determine by scoring rule
  const players = (this.players || []).filter(p => typeof p.score === 'number')
  if (!players.length) return null

  let winner = players[0]
  if (this.scoring === 'low') {
    for (let i = 1; i < players.length; i++) {
      if (players[i].score < winner.score) winner = players[i]
    }
  } else {
    for (let i = 1; i < players.length; i++) {
      if (players[i].score > winner.score) winner = players[i]
    }
  }

  return { name: winner.name, score: winner.score }
}

module.exports = mongoose.model('Game', gameSchema)
