import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Games() {
  const [user, setUser] = useState(null)
  const [games, setGames] = useState([])
  const [form, setForm] = useState({ name: '', scoring: 'low', targetScore: '' })
  const [loading, setLoading] = useState(false)
  const [addingPlayer, setAddingPlayer] = useState({})
  const [selectedWinner, setSelectedWinner] = useState({})
  const [editing, setEditing] = useState({})
  const [playerMenu, setPlayerMenu] = useState(null) // { gameId, playerId }
  const [renameValue, setRenameValue] = useState({})
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('[data-player-card]')) {
        setPlayerMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    api.get('/verify-token')
      .then((res) => setUser(res.data.user || null))
      .catch(() => setUser(null))

    fetchGames()
  }, [])

  async function fetchGames() {
    try {
      const res = await api.get('/games')
      setGames(res.data || [])
    } catch (err) {
      console.error('Error fetching games', err)
      setGames([])
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name) return
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        scoring: form.scoring,
        targetScore: form.targetScore ? Number(form.targetScore) : undefined,
      }
      const res = await api.post('/games', payload)
      setGames((prev) => [res.data, ...prev])
      setForm({ name: '', scoring: 'low', targetScore: '' })
    } catch (err) {
      console.error('Error creating game', err)
    } finally {
      setLoading(false)
    }
  }

  async function createGame() {
    if (!form.name) return alert('Name required')
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        scoring: form.scoring,
        targetScore: form.targetScore ? Number(form.targetScore) : undefined,
      }
      const res = await api.post('/games', payload)
      setGames((prev) => [res.data, ...prev])
      setForm({ name: '', scoring: 'low', targetScore: '' })
      setCreateOpen(false)
    } catch (err) {
      console.error('Error creating game', err)
      alert('Error creating game')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddPlayer(gameId) {
    const name = (addingPlayer[gameId] || '').trim()
    if (!name) return
    try {
      const res = await api.post(`/games/${gameId}/players`, { name })
      const updated = res.data
      setGames((prev) => prev.map(g => g._id === updated._id ? updated : g))
      setAddingPlayer((s) => ({ ...s, [gameId]: '' }))
    } catch (err) {
      console.error('Error adding player', err)
    }
  }

  async function handleFinish(gameId) {
    const winnerName = selectedWinner[gameId]
    try {
      const res = await api.post(`/games/${gameId}/finish`, winnerName ? { winnerName } : {})
      const updated = res.data
      setGames((prev) => prev.map(g => g._id === updated._id ? updated : g))
      setSelectedWinner((s) => ({ ...s, [gameId]: '' }))
    } catch (err) {
      console.error('Error finishing game', err)
    }
  }

  async function handleChangeScore(gameId, playerId, { delta, score } = {}) {
    try {
      const payload = {}
      if (typeof delta === 'number') payload.delta = delta
      if (typeof score === 'number') payload.score = score
      const res = await api.patch(`/games/${gameId}/players/${playerId}/score`, payload)
      const updated = res.data
      setGames((prev) => prev.map(g => g._id === updated._id ? updated : g))
    } catch (err) {
      console.error('Error changing score', err)
    }
  }

  async function handleSaveSettings(gameId) {
    const settings = editing[gameId]
    if (!settings) return
    try {
      const payload = {
        scoring: settings.scoring,
        targetScore: settings.targetScore === '' ? null : (settings.targetScore == null ? undefined : Number(settings.targetScore)),
        name: settings.name,
      }
      const res = await api.patch(`/games/${gameId}`, payload)
      const updated = res.data
      setGames((prev) => prev.map(g => g._id === updated._id ? updated : g))
      setEditing((s) => ({ ...s, [gameId]: undefined }))
    } catch (err) {
      console.error('Error saving settings', err)
    }
  }

  const activeGames = games.filter(g => g.status !== 'completed')

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Games</h1>
        <button type="button" onClick={() => setCreateOpen(true)} className="px-3 py-1 bg-green-600 text-white rounded-md">+ New</button>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCreateOpen(false)}>
          <div className="bg-white rounded-md p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-3">Create Game</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-md border px-2 py-1" />
              </div>

              <div>
                <label className="block text-sm font-medium">Scoring</label>
                <select value={form.scoring} onChange={(e) => setForm({ ...form, scoring: e.target.value })} className="mt-1 block w-full rounded-md border px-2 py-1">
                  <option value="low">Lowest score wins (golf)</option>
                  <option value="high">Highest score wins</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Target Score (optional)</label>
                <input type="number" value={form.targetScore} onChange={(e) => setForm({ ...form, targetScore: e.target.value })} className="mt-1 block w-full rounded-md border px-2 py-1" />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1 bg-gray-200 rounded-md" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-md" onClick={createGame}>{loading ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      <div>
        {activeGames.length === 0 ? (
          <p>No active games yet.</p>
        ) : (
          <ul className="space-y-4">
            {activeGames.map((g) => (
              <li key={g._id} className="p-4 border rounded-md">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-sm text-gray-600">Scoring: {g.scoring} {g.targetScore ? `• Target: ${g.targetScore}` : ''}</div>
                    <div className="mt-2">
                      {editing[g._id] ? (
                        <div className="flex gap-2 items-center">
                          <input value={editing[g._id].name} onChange={(e) => setEditing((s) => ({ ...s, [g._id]: { ...s[g._id], name: e.target.value } }))} className="rounded-md border px-2 py-1" />
                          <select value={editing[g._id].scoring} onChange={(e) => setEditing((s) => ({ ...s, [g._id]: { ...s[g._id], scoring: e.target.value } }))} className="rounded-md border px-2 py-1">
                            <option value="low">Lowest wins</option>
                            <option value="high">Highest wins</option>
                          </select>
                          <input type="number" value={editing[g._id].targetScore ?? ''} onChange={(e) => setEditing((s) => ({ ...s, [g._id]: { ...s[g._id], targetScore: e.target.value } }))} placeholder="Target (optional)" className="rounded-md border px-2 py-1" />
                          <button className="px-3 py-1 bg-blue-600 text-white rounded-md" onClick={() => handleSaveSettings(g._id)}>Save</button>
                          <button className="px-3 py-1 bg-gray-300 rounded-md" onClick={() => setEditing((s) => ({ ...s, [g._id]: undefined }))}>Cancel</button>
                        </div>
                      ) : (
                        <div className="mt-1">
                          {g.status !== 'completed' ? (
                            <button className="px-2 py-1 bg-yellow-500 text-white rounded-md" onClick={() => setEditing((s) => ({ ...s, [g._id]: { name: g.name, scoring: g.scoring, targetScore: g.targetScore ?? '' } }))}>Edit settings</button>
                          ) : (
                            <div className="text-sm text-gray-500">Settings locked (completed)</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 w-full">
                  <div className="font-medium text-center">Players</div>
                  <ul className="mt-2 flex flex-col gap-4 items-center">
                    {g.players && g.players.map((p, idx) => (
                      <li key={p._id || idx} className="relative flex flex-col items-center p-3 border rounded-md bg-white w-full max-w-md">
                        {g.status === 'completed' ? (
                          <span className="text-gray-800 mb-2">{p.name}</span>
                        ) : (
                          <button type="button" onClick={() => {
                            setPlayerMenu({ gameId: g._id, playerId: p._id })
                            setRenameValue((s) => ({ ...s, [`${g._id}_${p._id}`]: p.name }))
                          }} className="text-left text-blue-700 underline mb-2">{p.name}</button>
                        )}

                        <div className="mb-2">
                          {g.status === 'completed' ? (
                            <div className="w-20 h-10 flex items-center justify-center border rounded-md bg-gray-100 text-gray-600 font-medium">{p.score}</div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => handleChangeScore(g._id, p._id, { delta: -100 })} className="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer transition-colors">-100</button>
                                <button type="button" onClick={() => handleChangeScore(g._id, p._id, { delta: -10 })} className="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer transition-colors">-10</button>
                                <button type="button" onClick={() => handleChangeScore(g._id, p._id, { delta: -1 })} className="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer transition-colors">-1</button>
                              </div>

                              <button type="button" onClick={async () => {
                                const input = prompt(`Set score for ${p.name} (use "+N" or "-N" to add/subtract, or "current + N")`, String(p.score || 0))
                                if (input === null) return
                                const text = String(input).trim()

                                // Normalize input and support expressions like "-222 + 222" or "current + 137"
                                const lower = text.toLowerCase()

                                // If user references 'current', replace it with the current score and evaluate
                                if (lower.includes('current')) {
                                  const expr = text.replace(/current/ig, String(p.score || 0))
                                  const matches = expr.match(/[+-]?\d+/g)
                                  if (matches && matches.length) {
                                    const total = matches.reduce((acc, m) => acc + Number(m), 0)
                                    await handleChangeScore(g._id, p._id, { score: total })
                                    return
                                  }
                                  const num = Number(expr)
                                  if (!Number.isNaN(num)) {
                                    await handleChangeScore(g._id, p._id, { score: num })
                                    return
                                  }
                                }

                                // If there are multiple numeric terms (e.g. "-222 + 222" or "100 - 50"), evaluate by summing signed terms
                                const multiMatches = text.match(/[+-]?\d+/g) || []
                                if (multiMatches.length > 1) {
                                  const total = multiMatches.reduce((acc, m) => acc + Number(m), 0)
                                  await handleChangeScore(g._id, p._id, { score: total })
                                  return
                                }

                                // Single signed number like +137 or -25 -> treat as delta
                                const singleSigned = text.match(/^[+-]\s*\d+$/)
                                if (singleSigned) {
                                  const delta = Number(singleSigned[0].replace(/\s+/g, ''))
                                  if (Number.isNaN(delta)) return alert('Invalid number')
                                  await handleChangeScore(g._id, p._id, { delta })
                                  return
                                }

                                // Plain number -> set absolute
                                const num = Number(text)
                                if (!Number.isNaN(num)) {
                                  await handleChangeScore(g._id, p._id, { score: num })
                                  return
                                }

                                alert('Invalid input. Use expressions like "current + 137", "+137" for delta, or a number to set absolute score.')
                              }} className="w-28 h-12 flex items-center justify-center border rounded-md bg-white font-medium hover:bg-gray-50 cursor-pointer transition-colors">{p.score}</button>

                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => handleChangeScore(g._id, p._id, { delta: 1 })} className="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer transition-colors">+1</button>
                                <button type="button" onClick={() => handleChangeScore(g._id, p._id, { delta: 10 })} className="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer transition-colors">+10</button>
                                <button type="button" onClick={() => handleChangeScore(g._id, p._id, { delta: 100 })} className="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer transition-colors">+100</button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Player actions dropdown */}
                        {playerMenu && playerMenu.gameId === g._id && playerMenu.playerId === p._id && (
                          <div data-player-card className="absolute left-0 top-full mt-1 w-48 rounded-md border bg-white p-3 shadow-lg z-50">
                            <label className="block text-sm font-medium mb-2">Rename player</label>
                            <input value={renameValue[`${g._id}_${p._id}`] || ''} onChange={(e) => setRenameValue((s) => ({ ...s, [`${g._id}_${p._id}`]: e.target.value }))} className="w-full rounded-md border px-2 py-1 mb-2" />
                            <div className="flex gap-2">
                              <button className="flex-1 px-2 py-1 bg-blue-600 text-white rounded-md" onClick={async () => {
                                const newName = (renameValue[`${g._id}_${p._id}`] || '').trim()
                                if (!newName) return alert('Name required')
                                try {
                                  const res = await api.patch(`/games/${g._id}/players/${p._id}`, { name: newName })
                                  const updated = res.data
                                  setGames((prev) => prev.map(gg => gg._id === updated._id ? updated : gg))
                                  setPlayerMenu(null)
                                } catch (err) {
                                  console.error('Error renaming player', err)
                                }
                              }}>Save</button>
                              <button className="px-2 py-1 bg-red-500 text-white rounded-md" onClick={async () => {
                                if (!confirm(`Remove player ${p.name}?`)) return
                                try {
                                  const res = await api.delete(`/games/${g._id}/players/${p._id}`)
                                  const updated = res.data
                                  setGames((prev) => prev.map(gg => gg._id === updated._id ? updated : gg))
                                  setPlayerMenu(null)
                                } catch (err) {
                                  console.error('Error removing player', err)
                                }
                              }}>Delete</button>
                            </div>
                            <div className="mt-2 text-right">
                              <button className="px-2 py-1 bg-gray-200 rounded-md" onClick={() => setPlayerMenu(null)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {g.status !== 'completed' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium">Add player</label>
                      <div className="flex gap-2 mt-1">
                        <input value={addingPlayer[g._id] || ''} onChange={(e) => setAddingPlayer((s) => ({ ...s, [g._id]: e.target.value }))} className="flex-1 rounded-md border px-2" />
                        <button type="button" onClick={() => handleAddPlayer(g._id)} className="px-3 py-1 bg-green-600 text-white rounded-md">Add</button>
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    {g.status === 'completed' ? (
                      <div className="text-sm text-green-700">Finished — Winner: {g.winner?.name || '—' } {g.winner?.score != null ? `(${g.winner.score})` : ''}</div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select value={selectedWinner[g._id] || ''} onChange={(e) => setSelectedWinner((s) => ({ ...s, [g._id]: e.target.value }))} className="rounded-md border px-2 py-1">
                          <option value="">(auto compute)</option>
                          {g.players && g.players.map((p, idx) => (
                            <option key={p._id || idx} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => handleFinish(g._id)} className="px-3 py-1 bg-red-600 text-white rounded-md">Finish</button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
