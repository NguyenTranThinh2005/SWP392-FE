'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { EditSeriesForm, type EditSeriesInput } from '@/components/forms/edit-series-form'
import { proposalService } from '@/services/proposalService'
import type { Proposal } from '@/types/proposal'
import { notificationStore } from '@/store/notificationStore'
import { toast } from 'sonner'

export default function EditSeriesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [successMessage, setSuccessMessage] = useState<boolean>(false)
  const [seriesId, setSeriesId] = useState<string | null>(null)
  const [series, setSeries] = useState<Proposal | null>(null)
  const [mangakaId, setMangakaId] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user-info')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed?.id) {
            setMangakaId(parsed.id)
          }
        } catch { }
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      if (id) {
        setSeriesId(id)
        proposalService.getProposalById(id).then((p) => {
          if (p) {
            setSeries(p)
          }
          setIsFetching(false)
        }).catch((err) => {
          console.error('Failed to fetch series:', err)
          setIsFetching(false)
        })
      } else {
        setIsFetching(false)
      }
    }
  }, [])

  const handleSubmit = useCallback(
    async (data: EditSeriesInput) => {
      if (!seriesId || !series) return

      setIsLoading(true)
      try {
        // Double-check ownership
        if (series.mangakaId.toLowerCase() !== mangakaId.toLowerCase()) {
          throw new Error('Bạn không có quyền chỉnh sửa tác phẩm này.')
        }

        await proposalService.updateSeries(seriesId, {
          title: data.title,
          genre: data.genre,
          publicationType: data.publicationType,
          synopsis: data.synopsis,
          coverImagePublicUrl: data.coverImagePublicUrl,
        })

        // Dispatch notifications
        notificationStore.addNotification(
          'Series Updated',
          `Tác phẩm "${data.title}" của bạn đã được cập nhật thành công.`,
          'Mangaka',
          'success'
        )

        toast.success('Cập nhật tác phẩm thành công!')
        setSuccessMessage(true)
        setTimeout(() => router.push('/dashboard/series'), 1200)
      } catch (err: any) {
        toast.error(err?.message || 'Đã có lỗi xảy ra khi cập nhật tác phẩm.')
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [router, mangakaId, seriesId, series]
  )

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!series) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-card border border-border rounded-xl p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="font-bold text-lg text-foreground">Không tìm thấy tác phẩm</h3>
        <p className="text-sm text-muted-foreground">
          Đường dẫn không hợp lệ hoặc tác phẩm không tồn tại trong hệ thống.
        </p>
        <Link
          href="/dashboard/series"
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg"
        >
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  const isOwner = series.mangakaId.toLowerCase() === mangakaId.toLowerCase()

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-card border border-border rounded-xl p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="font-bold text-lg text-foreground">Không có quyền truy cập</h3>
        <p className="text-sm text-muted-foreground">
          Bạn không sở hữu tác phẩm này và không thể chỉnh sửa thông tin của nó.
        </p>
        <Link
          href="/dashboard/series"
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg"
        >
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <Link
          href="/dashboard/series"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Cập nhật tác phẩm</h1>
        <p className="text-sm text-muted-foreground">
          Chỉnh sửa thông tin tác phẩm của bạn. Thay đổi sẽ được cập nhật trực tiếp trong hệ thống.
        </p>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-emerald-800 dark:text-emerald-300">Tác phẩm được cập nhật thành công!</p>
            <p className="text-emerald-700/90 dark:text-emerald-400/95 text-xs mt-0.5">
              Đang chuyển hướng về trang quản lý tác phẩm...
            </p>
          </div>
        </div>
      )}

      {/* Form card */}
      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
        <EditSeriesForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          defaultValues={series}
        />
      </div>
    </div>
  )
}
