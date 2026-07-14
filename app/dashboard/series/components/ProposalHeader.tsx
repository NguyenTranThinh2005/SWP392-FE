'use client'

import { PencilLine, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'

interface ProposalHeaderProps {
  isBlocked: boolean
}

export default function ProposalHeader({ isBlocked }: ProposalHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <PencilLine className="w-7 h-7 text-primary" />
          My Proposals
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage all your series proposals and track their Editorial Board review status.
        </p>
      </div>

      {/* New Proposal button */}
      <div className="shrink-0">
        {isBlocked ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs font-semibold text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span>Đang có đề xuất chờ duyệt — Tạm khóa</span>
          </div>
        ) : (
          <Link
            href="/dashboard/series/new"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-lg shadow-sm shadow-primary/10 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Proposal
          </Link>
        )}
      </div>
    </div>
  )
}
