import React, { useEffect, useMemo, useRef } from 'react'
import { renderAsync } from 'docx-preview'

export type ResumeSource = {
  file: File
}

type Props = {
  open: boolean
  onClose: () => void
  title: string
  source?: ResumeSource
}

export default function ResumeModal({ open, onClose, title, source }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const objectUrl = useMemo(() => {
    if (!source) return undefined
    return URL.createObjectURL(source.file)
  }, [source])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  useEffect(() => {
    async function renderDocx() {
      if (!open || !source || !containerRef.current) return
      const name = source.file.name.toLowerCase()
      if (name.endsWith('.docx') || name.endsWith('.doc')) {
        containerRef.current.innerHTML = ''
        await renderAsync(await source.file.arrayBuffer(), containerRef.current, undefined, {
          inWrapper: false,
          className: 'docx-preview',
        })
      }
    }
    renderDocx()
  }, [open, source])

  if (!open) return null

  const isPdf = source?.file.name.toLowerCase().endsWith('.pdf')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            {source && (
              <a
                href={objectUrl}
                download={source.file.name}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
              >
                Download
              </a>
            )}
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50">Close</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {source && isPdf && (
            <object data={objectUrl} type="application/pdf" className="w-full h-[80vh]" />
          )}
          {source && !isPdf && (
            <div ref={containerRef} className="p-4" />
          )}
          {!source && (
            <div className="p-6 text-center text-gray-500">No file available</div>
          )}
        </div>
      </div>
    </div>
  )
}