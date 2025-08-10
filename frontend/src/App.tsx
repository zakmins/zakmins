import React, { useMemo, useState } from 'react'
import UploadSection from './components/UploadSection'
import ResultsTable from './components/ResultsTable'
import ResumeModal, { type ResumeSource } from './components/ResumeModal'
import { analyze } from './utils/api'
import type { UploadedResume, UploadedJD, AnalysisResult } from './types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function App() {
  const [uploadedResumes, setUploadedResumes] = useState<UploadedResume[]>([])
  const [uploadedJD, setUploadedJD] = useState<UploadedJD | null>(null)
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map())

  const [results, setResults] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalSource, setModalSource] = useState<ResumeSource | undefined>(undefined)

  const nameToId = useMemo(() => {
    const map = new Map<string, string>()
    uploadedResumes.forEach((r) => map.set(r.candidate_name, r.resume_id))
    return map
  }, [uploadedResumes])

  async function handleAnalyze() {
    if (!uploadedJD) return
    setLoading(true)
    try {
      const resumeIds = uploadedResumes.map((r) => r.resume_id)
      const data = await analyze(uploadedJD.jd_id, resumeIds)
      setResults(data)
    } catch (err) {
      console.error(err)
      alert('Analysis failed. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  function onUploaded(resumes: UploadedResume[], jd: UploadedJD, files: Map<string, File>) {
    setUploadedResumes(resumes)
    setUploadedJD(jd)
    setFileMap(files)
    setResults([])
  }

  function handleView(name: string) {
    const rid = nameToId.get(name)
    if (!rid) return
    const f = fileMap.get(rid)
    if (!f) return
    setModalTitle(name)
    setModalSource({ file: f })
    setModalOpen(true)
  }


  function exportCSVFixed() {
    const header = ['Candidate Name', 'Match %', 'Skills Matched', 'Missing Skills', 'Summary']
    const rows = results.map((r) => [
      r.candidate_name,
      r.match_score.toFixed(2),
      r.matched_skills.join('; '),
      r.missing_skills.join('; '),
      r.summary,
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((s) => '"' + (s || '').toString().replace(/"/g, '""') + '"').join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resume_analysis.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.text('Resume Analysis', 14, 12)
    const body = results.map((r) => [
      r.candidate_name,
      r.match_score.toFixed(2),
      r.matched_skills.join(', '),
      r.missing_skills.join(', '),
      r.summary,
    ])
    autoTable(doc, {
      head: [['Candidate Name', 'Match %', 'Skills Matched', 'Missing Skills', 'Summary']],
      body,
      startY: 18,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    })
    doc.save('resume_analysis.pdf')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Resume Analyzer</h1>
          <div className="text-sm text-gray-500">AI-powered screening for HR teams</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <UploadSection onUploaded={onUploaded} />

        {uploadedResumes.length > 0 && uploadedJD && (
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              className="px-4 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>
            <span className="text-sm text-gray-500">{uploadedResumes.length} resumes ready · JD prepared</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 flex gap-3">
            <button onClick={exportCSVFixed} className="px-3 py-1.5 rounded-md border hover:bg-gray-50">Export CSV</button>
            <button onClick={exportPDF} className="px-3 py-1.5 rounded-md border hover:bg-gray-50">Export PDF</button>
          </div>
        )}

        {results.length > 0 && (
          <ResultsTable results={results} onView={handleView} nameToId={nameToId} />
        )}
      </main>

      <footer className="py-8 text-center text-xs text-gray-400">© {new Date().getFullYear()} Resume Analyzer</footer>

      <ResumeModal open={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle} source={modalSource} />
    </div>
  )
}