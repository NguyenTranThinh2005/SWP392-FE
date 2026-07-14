'use client'

import { BookOpen, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface ProposalStatsProps {
  counts: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
}

export default function ProposalStats({ counts }: ProposalStatsProps) {
  const statsItems = [
    {
      label: 'Total',
      value: counts.total,
      icon: BookOpen,
      color: 'text-foreground',
    },
    {
      label: 'In Review',
      value: counts.pending,
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      label: 'Approved',
      value: counts.approved,
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      label: 'Rejected',
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
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
        >
          <div className={`${color} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-foreground leading-none">
              {value}
            </p>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
