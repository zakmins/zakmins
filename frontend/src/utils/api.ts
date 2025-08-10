import axios from 'axios'
import type { UploadedResume, UploadedJD, AnalysisResult } from '../types'

const api = axios.create({ baseURL: '/api' })

export async function uploadResumes(files: File[], onUploadProgress?: (p: number) => void) {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const res = await api.post<UploadedResume[]>('/upload-resumes', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (!onUploadProgress || !e.total) return
      const p = Math.round((e.loaded * 100) / e.total)
      onUploadProgress(p)
    },
  })
  return res.data
}

export async function uploadJobDescription(file?: File, text?: string) {
  if (!file && !text) throw new Error('Provide file or text')
  const form = new FormData()
  if (file) form.append('file', file)
  if (text) form.append('text', text)
  const res = await api.post<UploadedJD>('/upload-job-description', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function analyze(jd_id: string, resume_ids: string[]) {
  const res = await api.post<AnalysisResult[]>('/analyze', { jd_id, resume_ids })
  return res.data
}