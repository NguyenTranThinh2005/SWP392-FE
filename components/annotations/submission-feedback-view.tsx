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
    console.log('DEBUG submissionId:', submissionId)
    if (!submissionId) return
    annotationService.getAnnotations(submissionId).then(setPins).catch(() => setPins([]))
  }, [submissionId])

  // Neu la zip -> giai nen lay anh
  useEffect(() => {
    if (!imageUrl) return
    const isZip = /\.zip(\?|$)/i.test(imageUrl)
    if (isZip) {
      setLoading(true)
      extractImagesFromZip(imageUrl)
        .then((imgs) => setPages(imgs))
        .catch(() => setPages([]))
        .finally(() => setLoading(false))
    } else {
      // anh don -> 1 trang
      setPages([{ name: 'image', dataUrl: imageUrl }])
    }
  }, [imageUrl])

  if (!imageUrl) return null

  // Pin cua trang dang xem (pageNo tinh tu 1, currentPage tu 0)
  const pinsOnPage = pins.filter((p) => (p.pageNo || 1) === pageStart + currentPage)
  const currentImg = pages[currentPage]
  console.log('DEBUG pins:', pins.map(p => p.pageNo), '| currentPage:', currentPage, '| pages:', pages.length, '| pinsOnPage:', pinsOnPage.length)

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase font-bold text-muted-foreground">Bài nộp của bạn + góp ý trên ảnh</p>

      {loading && <p className="text-xs text-muted-foreground">Đang tải ảnh...</p>}

      {currentImg && (
        <div className="relative inline-block max-w-full border border-border rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentImg.dataUrl} alt="Bài nộp" className="max-w-full max-h-80 object-contain pointer-events-none" />
          {pinsOnPage.map((pin, idx) => (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${pin.positionX * 100}%`, top: `${pin.positionY * 100}%` }}
            >
              <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow cursor-help">
                {idx + 1}
              </div>
              <div className="absolute left-6 top-0 hidden group-hover:block bg-black/85 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10 max-w-[200px]">
                {pin.content}
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
            ‹ Trước
          </button>
          <span>Trang {currentPage + 1}/{pages.length}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
            disabled={currentPage === pages.length - 1}
            className="px-2 py-1 rounded bg-muted disabled:opacity-40"
          >
            Sau ›
          </button>
        </div>
      )}

      {/* Danh sach text tat ca pin */}
      {pins.length > 0 && (
        <div className="space-y-1">
          {[...pins]
            .sort((a, b) => (a.pageNo || 0) - (b.pageNo || 0))
            .map((pin, idx) => (
              <p key={idx} className="text-[11px] text-red-600 dark:text-red-400">
                <span className="font-bold">{idx + 1}.</span> (Trang {(pin.pageNo || pageStart) - pageStart + 1}) {pin.content}
              </p>
            ))}
        </div>
      )}

      <a href={imageUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary underline block">
        Tải bài nộp gốc
      </a>
    </div>
  )
}
