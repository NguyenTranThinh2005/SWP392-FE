'use client'
import { useEffect, useState } from 'react'
import { annotationService, type SubmissionAnnotation } from '@/services/annotationService'
import { ZipImageViewer } from '@/components/annotations/zip-image-viewer'

interface Props {
  submissionId?: string
  imageUrl?: string
  assetId?: string | null
  pageStart?: number
  maxHeightClass?: string
}

// Hien anh bai nop voi khung UI ZipImageViewer + pin gop y cua Mangaka
export function SubmissionFeedbackView({
  submissionId,
  imageUrl,
  assetId,
  pageStart = 1,
  maxHeightClass = 'max-h-[480px]'
}: Props) {
  const [pins, setPins] = useState<SubmissionAnnotation[]>([])

  // Load pin tu BE
  useEffect(() => {
    if (!submissionId) return
    annotationService.getAnnotations(submissionId).then(setPins).catch(() => setPins([]))
  }, [submissionId])

  if (!imageUrl) return null

  // Sắp xếp pin tăng dần theo trang (pageNo), từ trên xuống dưới (positionY), từ trái sang phải (positionX)
  // để tạo số thứ tự nhất quán (displayNo 1, 2, 3...) liên tục từ Trang 1 đến các trang tiếp theo
  const sortedPins = [...pins].sort((a, b) => {
    const pageA = a.pageNo || 1
    const pageB = b.pageNo || 1
    if (pageA !== pageB) return pageA - pageB
    if (a.positionY !== b.positionY) return (a.positionY || 0) - (b.positionY || 0)
    return (a.positionX || 0) - (b.positionX || 0)
  })

  const pinsWithNo = sortedPins.map((p, i) => ({ ...p, displayNo: i + 1 }))

  return (
    <div className="space-y-3">
      {/* Khung UI ZipImageViewer nguyen ban + Pins Overlay */}
      <ZipImageViewer fileUrl={imageUrl} assetId={assetId} maxHeightClass={maxHeightClass}>
        {(_currentPage, pageIndex) => {
          const pinsOnPage = pinsWithNo.filter((p) => (p.pageNo || 1) === pageStart + pageIndex)

          return (
            <>
              {pinsOnPage.map((pin, idx) => (
                <div
                  key={idx}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
                  style={{ left: `${pin.positionX * 100}%`, top: `${pin.positionY * 100}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-red-500 ring-2 ring-white text-white text-[11px] font-bold flex items-center justify-center shadow-lg cursor-help transition-transform hover:scale-110">
                    {pin.displayNo}
                  </div>
                  <div className="absolute left-7 top-1/2 -translate-y-1/2 hidden group-hover:block z-30">
                    <div className="relative bg-neutral-900 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl max-w-[240px] whitespace-normal">
                      <span className="block text-[9px] uppercase tracking-wide text-red-300 font-bold mb-0.5">
                        Góp ý #{pin.displayNo}
                      </span>
                      {pin.content}
                      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )
        }}
      </ZipImageViewer>

      {/* Danh sach text tat ca pin */}
      {pins.length > 0 && (
        <div className="space-y-1 p-2 bg-red-500/5 rounded-xl border border-red-500/10">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Feedback Pins ({pins.length})</p>
          {pinsWithNo.map((pin, idx) => (
            <p key={idx} className="text-[11px] text-red-600 dark:text-red-400">
              <span className="font-bold">{pin.displayNo}.</span> (Page {(pin.pageNo || pageStart) - pageStart + 1}) {pin.content}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

