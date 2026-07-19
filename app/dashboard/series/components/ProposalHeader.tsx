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
    </div>
  )
}
