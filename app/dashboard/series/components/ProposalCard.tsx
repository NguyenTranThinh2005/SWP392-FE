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
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: Clock,
  },
  'Under Review': {
    label: 'Reviewing',
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    icon: Eye,
  },
  'Board Voting': {
    label: 'Voting',
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
    label: 'Active',
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
    <div className="bg-card border border-border overflow-hidden hover:border-primary/25 hover:shadow-lg transition-all flex flex-row group">
      {/* Left Cover */}
      <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden bg-slate-900 aspect-[3/4]">
        {proposal.coverImagePublicUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={proposal.coverImagePublicUrl}
            alt={proposal.title}
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-900 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Type Badge on cover */}
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase border border-white/5">
            {proposal.publicationType}
          </span>
        </div>
      </div>

      {/* Right Content */}
      <div className="p-4 flex-1 flex flex-col justify-between min-w-0 space-y-2">
        <div>
          <div className="flex justify-between items-start gap-1">
            <h3 className="font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors cursor-pointer" title={proposal.title}>
              {proposal.title}
            </h3>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold shrink-0 border ${config.className}`}>
              <StatusIcon className="w-2.5 h-2.5" />
              {config.label}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
            by {proposal.author || 'Unknown'} • <CalendarDays className="w-3 h-3 text-muted-foreground/60" /> {formatDateShort(activeDate)}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">
            {proposal.synopsis}
          </p>
        </div>

        {/* Genres & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px]">
          <div className="flex flex-wrap gap-1 min-w-0">
            {genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="bg-muted text-muted-foreground text-[8px] font-semibold px-1.5 py-0.5 rounded truncate"
              >
                {g}
              </span>
            ))}
          </div>

          <div className="flex gap-1.5 shrink-0">
            {isDraft && (
              <>
                <button
                  onClick={() => onDelete(proposal.id)}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1 text-[9px] font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 border border-border rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Xóa
                </button>
                <Link
                  href={`/dashboard/series/new?edit=${proposal.id}`}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1 text-[9px] font-semibold bg-primary/10 text-primary hover:bg-primary/15 rounded-lg transition-colors"
                >
                  <FileEdit className="w-3 h-3" /> Sửa
                </Link>
              </>
            )}
            {(proposal.status === 'Active' || proposal.status === 'Approved') && (
              <Link
                href={`/dashboard/series/edit?id=${proposal.id}`}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[9px] font-semibold bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/15 rounded-lg transition-colors"
              >
                <FileEdit className="w-3 h-3" /> Cập nhật
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
