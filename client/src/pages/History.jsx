import React, { useEffect, useState } from 'react'
import api from '../api'

export default function History() {
  const [games, setGames] = useState([])

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get('/games')
        setGames(res.data || [])
      } catch (err) {
        console.error('Error fetching games', err)
        setGames([])
      }
    }
    fetch()
  }, [])

  const completed = games.filter(g => g.status === 'completed')

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">History</h1>
      </div>

      {completed.length === 0 ? (
        <p>No completed games yet.</p>
      ) : (
        <ul className="space-y-4">
          {completed.map(g => (
            <li key={g._id} className="p-4 border rounded-md">
              <div className="font-semibold">{g.name}</div>
              <div className="text-sm text-gray-600">Finished — Winner: {g.winner?.name || '—'} {g.winner?.score != null ? `(${g.winner.score})` : ''}</div>
              <div className="mt-2 flex flex-wrap gap-4">
                {g.players && g.players.map(p => (
                  <div key={p._id || p.name} className="flex flex-col items-center p-2 border rounded-md bg-white" style={{ minWidth: 120 }}>
                    <div className="text-sm mb-1">{p.name}</div>
                    <div className="w-16 h-8 flex items-center justify-center border rounded-md bg-gray-100 text-gray-600 font-medium">{p.score}</div>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
