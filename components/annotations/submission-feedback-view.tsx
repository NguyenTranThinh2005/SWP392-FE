'use client'
import { useEffect, useState } from 'react'
import { annotationService, type SubmissionAnnotation } from '@/services/annotationService'
import { extractImagesFromZip } from '@/lib/imageCompare'

interface Props {
  submissionId?: string
  imageUrl?: string
  pageStart?: number
}

// Hien anh bai nop + pin gop y cua Mangaka (assistant chi xem, doc)
export function SubmissionFeedbackView({ submissionId, imageUrl, pageStart = 1 }: Props) {
  const [pins, setPins] = useState<SubmissionAnnotation[]>([])
  const [pages, setPages] = useState<{ name: string; dataUrl: string }[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(false)

  // Load pin tu BE
  useEffect(() => {
    if (!submissionId) return
    annotationService.getAnnotations(submissionId).then(setPins).catch(() => setPins([]))
  }, [submissionId])

  // Neu la zip -> giai nen lay anh
  useEffect(() => {
    if (!imageUrl) return
    setLoading(true)
    extractImagesFromZip(imageUrl)
      .then((imgs) => setPages(imgs))
      .catch(() => setPages([{ name: 'image', dataUrl: imageUrl }]))
      .finally(() => setLoading(false))
  }, [imageUrl])

  if (!imageUrl) return null

  // Pin cua trang dang xem (pageNo tinh tu 1, currentPage tu 0)
  // BE tra ve thu tu nguoc (moi nhat truoc) -> dao lai cho khop thu tu ghim
  const pinsWithNo = [...pins].reverse().map((p, i) => ({ ...p, displayNo: i + 1 }))
  const pinsOnPage = pinsWithNo.filter((p) => (p.pageNo || 1) === pageStart + currentPage)
  const currentImg = pages[currentPage]
  
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase font-bold text-muted-foreground">Your submission + comments on image</p>

      {loading && <p className="text-xs text-muted-foreground">Loading image...</p>}

      {currentImg && (
        <div className="relative inline-block max-w-full border border-border rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentImg.dataUrl} alt="Submission" className="max-w-full max-h-80 object-contain pointer-events-none" />
          {pinsOnPage.map((pin, idx) => (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${pin.positionX * 100}%`, top: `${pin.positionY * 100}%` }}
            >
              <div className="w-6 h-6 rounded-full bg-red-500 ring-2 ring-white text-white text-[11px] font-bold flex items-center justify-center shadow-lg cursor-help transition-transform hover:scale-110">
              {pin.displayNo}
              </div>
              <div className="absolute left-7 top-1/2 -translate-y-1/2 hidden group-hover:block z-20">
                <div className="relative bg-neutral-900 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl max-w-[240px] whitespace-normal">
                  <span className="block text-[9px] uppercase tracking-wide text-red-300 font-bold mb-0.5">Góp ý #{pin.displayNo}</span>
                  {pin.content}
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Chuyen trang neu nhieu trang */}
      {pages.length > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-2 py-1 rounded bg-muted disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span>Page {currentPage + 1}/{pages.length}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
            disabled={currentPage === pages.length - 1}
            className="px-2 py-1 rounded bg-muted disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      )}

      {/* Danh sach text tat ca pin */}
      {pins.length > 0 && (
        <div className="space-y-1">
          {pinsWithNo.map((pin, idx) => (
            <p key={idx} className="text-[11px] text-red-600 dark:text-red-400">
              <span className="font-bold">{pin.displayNo}.</span> (Page {(pin.pageNo || pageStart) - pageStart + 1}) {pin.content}
            </p>
          ))}
        </div>
      )}

      <a href={imageUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary underline block">
        Download original submission
      </a>
    </div>
  )
}
