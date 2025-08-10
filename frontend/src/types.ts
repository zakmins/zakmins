export type UploadedResume = {
  resume_id: string
  filename: string
  candidate_name: string
  text_preview: string
}

export type UploadedJD = {
  jd_id: string
  filename?: string
  text_preview: string
}

export type AnalysisResult = {
  candidate_name: string
  match_score: number
  matched_skills: string[]
  missing_skills: string[]
  summary: string
}