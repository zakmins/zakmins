import React, { useRef, useState } from 'react'
import { uploadResumes, uploadJobDescription } from '../utils/api'
import type { UploadedResume, UploadedJD } from '../types'

type Props = {
  onUploaded: (resumes: UploadedResume[], jd: UploadedJD, fileMap: Map<string, File>) => void
}

export default function UploadSection({ onUploaded }: Props) {
  const [resumeProgress, setResumeProgress] = useState<number>(0)
  const [jdProgress, setJdProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [jdText, setJdText] = useState<string>('')
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const jdInputRef = useRef<HTMLInputElement>(null)

  const [selectedResumes, setSelectedResumes] = useState<File[]>([])
  const [selectedJD, setSelectedJD] = useState<File | undefined>(undefined)

  function handleResumeSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : []
    setSelectedResumes(files)
  }

  function handleJDSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setSelectedJD(file)
  }

  async function handleStartUpload() {
    if (selectedResumes.length === 0) return
    setIsUploading(true)
    try {
      const fileMap = new Map<string, File>()
      const resumesResp = await uploadResumes(selectedResumes, (p) => setResumeProgress(p))
      resumesResp.forEach((r, idx) => fileMap.set(r.resume_id, selectedResumes[idx]))

      const jdResp = await uploadJobDescription(selectedJD, jdText)
      setJdProgress(100)

      onUploaded(resumesResp, jdResp, fileMap)
    } catch (err) {
      console.error(err)
      alert('Upload failed. Check console for details.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800">Upload</h2>
      <p className="text-sm text-gray-500 mt-1">Upload multiple resumes and a job description (file or paste text).</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Resumes (PDF/DOCX)</label>
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            multiple
            onChange={handleResumeSelect}
            className="mt-2 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-100 file:text-brand-600 hover:file:bg-brand-50"
          />
          {selectedResumes.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">{selectedResumes.length} files selected</p>
          )}
          {isUploading && (
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${resumeProgress}%` }} />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Job Description (PDF/DOCX or paste text)</label>
          <input
            ref={jdInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleJDSelect}
            className="mt-2 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-100 file:text-brand-600 hover:file:bg-brand-50"
          />
          <textarea
            placeholder="Or paste job description text here"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            className="mt-3 w-full h-28 p-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {isUploading && (
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${jdProgress}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleStartUpload}
          className="px-4 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-50"
          disabled={isUploading || selectedResumes.length === 0 || (!selectedJD && jdText.trim() === '')}
        >
          {isUploading ? 'Uploading…' : 'Start Upload'}
        </button>
      </div>
    </div>
  )
}