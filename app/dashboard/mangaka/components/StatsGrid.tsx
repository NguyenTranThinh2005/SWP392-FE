'use client'

import { PencilLine, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface StatsGridProps {
  counts: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
}

export default function StatsGrid({ counts }: StatsGridProps) {
  const statsItems = [
    {
      label: 'Tổng số đề xuất',
      value: counts.total,
      icon: PencilLine,
      color: 'text-foreground',
    },
    {
      label: 'Đang duyệt',
      value: counts.pending,
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      label: 'Đã duyệt',
      value: counts.approved,
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      label: 'Bị từ chối',
      value: counts.rejected,
      icon: XCircle,
      color: 'text-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {statsItems.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="bg-card border border-border rounded-2xl p-5 space-y-3"
        >
          <div
            className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}
          >
            <Icon className="w-6.5 h-6.5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-foreground leading-none">
              {value}
            </p>
            <p className="text-[11px] text-muted-foreground font-semibold mt-1">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
