'use client'

import { PencilLine, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'

interface ProposalHeaderProps {
  isBlocked: boolean
}

export default function ProposalHeader({ isBlocked }: ProposalHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <PencilLine className="w-7 h-7 text-primary" />
          My Proposals
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage all your series proposals and track their Editorial Board review status.
        </p>
      </div>
      <div>
        <Link
          href={isBlocked ? '#' : '/dashboard/series/new'}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
            isBlocked
              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
          }`}
          onClick={(e) => {
            if (isBlocked) e.preventDefault()
          }}
          title={isBlocked ? 'You already have a proposal pending review' : 'Create New Proposal'}
        >
          <Plus className="w-4 h-4" />
          Create Proposal
        </Link>
      </div>
    </div>
  )
}
