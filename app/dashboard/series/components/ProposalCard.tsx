'use client'

import {
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  Eye,
  Trash2,
  BookOpen,
  CalendarDays,
} from 'lucide-react'
import Link from 'next/link'
import type { Proposal, ProposalStatus } from '@/types/proposal'

// Status badge config
const STATUS_CONFIG: Record<
  ProposalStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  Draft: {
    label: 'Draft',
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    icon: FileEdit,
  },
  'Pending Review': {
    label: 'Pending Review',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: Clock,
  },
  'Under Review': {
    label: 'Under Review',
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    icon: Eye,
  },
  'Board Voting': {
    label: 'Board Voting',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: Eye,
  },
  Approved: {
    label: 'Approved',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: CheckCircle2,
  },
  Rejected: {
    label: 'Rejected',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: XCircle,
  },
  Active: {
    label: 'Approved & Active',
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    icon: CheckCircle2,
  },
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface ProposalCardProps {
  proposal: Proposal
  onDelete: (id: string) => void
}

export default function ProposalCard({
  proposal,
  onDelete,
}: ProposalCardProps) {
  const config = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.Draft
  const StatusIcon = config.icon
  const isDraft = proposal.status === 'Draft'
  const genres = proposal.genre.split(', ').filter(Boolean)
  const activeDate = proposal.submittedAt || proposal.createdAt

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/25 hover:shadow-md transition-all group">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-40 md:w-48 shrink-0 bg-muted border-b sm:border-b-0 sm:border-r border-border">
          <div className="aspect-[3/4] sm:h-full sm:min-h-48 w-full overflow-hidden bg-muted flex items-center justify-center">
            {proposal.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proposal.coverImageUrl}
                alt={proposal.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <BookOpen className="w-10 h-10 text-muted-foreground/40" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className="text-lg font-extrabold text-foreground truncate group-hover:text-primary transition-colors">
                {proposal.title}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {proposal.id}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${config.className}`}
            >
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2 md:col-span-1">
              <p className="text-[11px] uppercase font-bold text-muted-foreground">
                Genre
              </p>
              <div className="flex flex-wrap gap-1.5">
                {genres.length > 0 ? (
                  genres.map((genre) => (
                    <span
                      key={genre}
                      className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-1 rounded-md"
                    >
                      {genre}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">No genre</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] uppercase font-bold text-muted-foreground">
                Mangaka
              </p>
              <p className="font-semibold text-foreground truncate">
                {proposal.author || 'Unknown'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] uppercase font-bold text-muted-foreground">
                Active date
              </p>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                {formatDateShort(activeDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
            <span className="text-xs text-muted-foreground font-semibold">
              {proposal.publicationType}
            </span>

            {isDraft && (
              <div className="flex gap-2 sm:justify-end">
                <button
                  onClick={() => onDelete(proposal.id)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 border border-border rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Draft
                </button>
                <Link
                  href={`/dashboard/series/new?edit=${proposal.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/15 rounded-lg transition-colors"
                >
                  <FileEdit className="w-3.5 h-3.5" /> Edit Draft
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
