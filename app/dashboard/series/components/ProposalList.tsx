'use client'

import { PencilLine, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Proposal, ProposalStatus } from '@/types/proposal'
import ProposalCard from './ProposalCard'

interface ProposalListProps {
  filteredProposals: Proposal[]
  statusFilter: ProposalStatus | 'All'
  isBlocked: boolean
  onDelete: (id: string) => void
}

export default function ProposalList({
  filteredProposals,
  statusFilter,
  isBlocked,
  onDelete,
}: ProposalListProps) {
  if (filteredProposals.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-16 text-center space-y-4">
      <PencilLine className="w-12 h-12 text-muted-foreground/30 mx-auto" />
      <div>
        <h3 className="font-bold text-lg text-foreground">
          {statusFilter === 'All'
            ? 'No proposals yet'
            : `No ${statusFilter} proposals`}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {statusFilter === 'All'
            ? "You haven't submitted any series proposals. Start pitching your story!"
            : `No proposals with status "${statusFilter}".`}
        </p>
      </div>
      {statusFilter === 'All' && !isBlocked && (
        <Link
          href="/dashboard/series/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-lg shadow-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Your First Proposal
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}
