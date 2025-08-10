import React, { useMemo, useState } from 'react'
import type { AnalysisResult } from '../types'

type Props = {
  results: AnalysisResult[]
  onView: (name: string) => void
  nameToId: Map<string, string>
}

export default function ResultsTable({ results, onView, nameToId }: Props) {
  const [sortDesc, setSortDesc] = useState(true)

  const sorted = useMemo(() => {
    const arr = [...results]
    arr.sort((a, b) => (sortDesc ? b.match_score - a.match_score : a.match_score - b.match_score))
    return arr
  }, [results, sortDesc])

  function colorForScore(score: number) {
    if (score >= 75) return 'text-green-700 bg-green-50'
    if (score >= 50) return 'text-yellow-700 bg-yellow-50'
    return 'text-red-700 bg-red-50'
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Results</h2>
        <button
          onClick={() => setSortDesc((s) => !s)}
          className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
        >
          Sort by Match {sortDesc ? '↓' : '↑'}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Candidate Name</th>
              <th className="px-4 py-3">Match %</th>
              <th className="px-4 py-3">Skills Matched</th>
              <th className="px-4 py-3">Missing Skills</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {sorted.map((r) => (
              <tr key={r.candidate_name}>
                <td className="px-4 py-3 font-medium text-gray-800">{r.candidate_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${colorForScore(r.match_score)}`}>
                    {r.match_score.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{r.matched_skills.join(', ') || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{r.missing_skills.join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onView(r.candidate_name)}
                    className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
                  >
                    View Resume
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}