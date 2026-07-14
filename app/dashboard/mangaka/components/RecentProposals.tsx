'use client'

import {
  PencilLine,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileEdit,
  Eye,
  CalendarDays,
  TrendingUp,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import type { Proposal, ProposalStatus } from '@/types/proposal'

const STATUS_CONFIG: Record<
  ProposalStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  Draft: {
    label: 'Bản thảo',
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    icon: FileEdit,
  },
  'Pending Review': {
    label: 'Chờ duyệt (cũ)',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: Clock,
  },
  'Under Review': {
    label: 'Tantou đang xem xét',
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    icon: Eye,
  },
  'Board Voting': {
    label: 'Ban biên tập đang bỏ phiếu',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: Eye,
  },
  Approved: {
    label: 'Đã duyệt',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: CheckCircle2,
  },
  Rejected: {
    label: 'Bị từ chối',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: XCircle,
  },
  Active: {
    label: 'Đã duyệt & Đang phát hành',
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    icon: CheckCircle2,
  },
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface RecentProposalsProps {
  proposals: Proposal[]
}

export default function RecentProposals({ proposals }: RecentProposalsProps) {
  const recent = [...proposals]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3)

  return (
    <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm">Đề xuất gần đây</h2>
        </div>
        <Link
          href="/dashboard/series"
          className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
        >
          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {recent.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <PencilLine className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">Chưa có đề xuất nào</p>
            <Link
              href="/dashboard/series/new"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo đề xuất đầu tiên của bạn
            </Link>
          </div>
        ) : (
          recent.map((p) => {
            const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.Draft
            const StatusIcon = config.icon
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                {/* Left accent */}
                <div
                  className={`w-1 h-10 rounded-full shrink-0 ${
                    p.status === 'Approved'
                      ? 'bg-emerald-500'
                      : p.status === 'Rejected'
                      ? 'bg-red-500'
                      : p.status === 'Under Review'
                      ? 'bg-blue-500'
                      : p.status === 'Pending Review'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">
                    {p.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {p.id}
                    </span>
                    <span className="text-muted-foreground/30">•</span>
                    <CalendarDays className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateShort(p.submittedAt ?? p.createdAt)}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${config.className}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
