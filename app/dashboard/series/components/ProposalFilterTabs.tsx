'use client'

import { Filter } from 'lucide-react'
import type { Proposal, ProposalStatus } from '@/types/proposal'

interface ProposalFilterTabsProps {
  proposals: Proposal[]
  statusFilter: ProposalStatus | 'All'
  setStatusFilter: (filter: ProposalStatus | 'All') => void
}

const ALL_STATUSES: (ProposalStatus | 'All')[] = [
  'All',
  'Draft',
  'Under Review',
  'Board Voting',
  'Approved',
  'Rejected',
  'Active',
]

export default function ProposalFilterTabs({
  proposals,
  statusFilter,
  setStatusFilter,
}: ProposalFilterTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
      {ALL_STATUSES.map((s) => {
        const count =
          s === 'All'
            ? proposals.length
            : proposals.filter((p) => p.status === s).length
        return (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            {s} <span className="opacity-70 ml-1">({count})</span>
          </button>
        )
      })}
    </div>
  )
}
