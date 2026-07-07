'use client'
import { useEffect, useState } from 'react'
import { annotationService, type SubmissionAnnotation } from '@/services/annotationService'

interface Props {
  submissionId?: string
  imageUrl?: string
}

// Hien anh bai nop + cac pin gop y cua Mangaka (assistant chi xem)
export function SubmissionFeedbackView({ submissionId, imageUrl }: Props) {
  const [pins, setPins] = useState<SubmissionAnnotation[]>([])

  useEffect(() => {
    if (!submissionId) return
    annotationService.getAnnotations(submissionId).then(setPins).catch(() => setPins([]))
  }, [submissionId])

  if (!imageUrl) return null
  const isZip = /\.zip(\?|$)/i.test(imageUrl)

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase font-bold text-muted-foreground">Bài nộp của bạn + góp ý trên ảnh</p>
      {isZip ? (
        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
          📦 File nén — <a href={imageUrl} target="_blank" rel="noreferrer" className="text-primary underline">tải về xem</a>
        </div>
      ) : (
        <div className="relative inline-block max-w-full border border-border rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Bài nộp" className="max-w-full max-h-80 object-contain pointer-events-none" />
          {pins.map((pin, idx) => (
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
      {pins.length > 0 && (
        <div className="space-y-1">
          {pins.map((pin, idx) => (
            <p key={idx} className="text-[11px] text-red-600 dark:text-red-400">
              <span className="font-bold">{idx + 1}.</span> (Trang {pin.pageNo}) {pin.content}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}