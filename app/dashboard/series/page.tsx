'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  PencilLine,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  Eye,
  Trash2,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  Filter,
  CalendarDays,
} from 'lucide-react'
import { proposalService } from '@/services/proposalService'
import type { Proposal, ProposalStatus } from '@/types/proposal'
import { toast } from 'sonner'

const { getProposalsByMangaka, deleteDraft, hasPendingProposal } = proposalService

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

const ALL_STATUSES: (ProposalStatus | 'All')[] = [
  'All',
  'Draft',
  'Under Review',
  'Board Voting',
  'Approved',
  'Rejected',
  'Active',
]

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ProposalCard({
  proposal,
  onDelete,
}: {
  proposal: Proposal
  onDelete: (id: string) => void
}) {
  const config = STATUS_CONFIG[proposal.status]
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
              <p className="text-xs text-muted-foreground font-mono">{proposal.id}</p>
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
              <p className="text-[11px] uppercase font-bold text-muted-foreground">Genre</p>
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
              <p className="text-[11px] uppercase font-bold text-muted-foreground">Mangaka</p>
              <p className="font-semibold text-foreground truncate">{proposal.author || 'Unknown'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] uppercase font-bold text-muted-foreground">Active date</p>
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

export default function MyProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'All'>('All')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [mangakaId, setMangakaId] = useState('')

  const [isBlocked, setIsBlocked] = useState(false)

  const reload = useCallback(async (currentId: string) => {
    if (!currentId) return
    const list = await getProposalsByMangaka(currentId)
    setProposals(list)
    const blocked = await hasPendingProposal(currentId)
    setIsBlocked(blocked)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('user-info')
    let currentId = ''
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.id) {
          currentId = parsed.id
          setMangakaId(parsed.id)
        }
      } catch { }
    }
    reload(currentId)
  }, [reload])

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        const success = await deleteDraft(deleteConfirmId)
        if (success) {
          toast.success('Xóa bản thảo thành công!')
        } else {
          toast.error('Xóa bản thảo thất bại. Có thể do giới hạn phân quyền API (AdminOnly).')
        }
      } catch (err: any) {
        toast.error(err?.message || 'Có lỗi xảy ra khi xóa bản thảo.')
      }
      setDeleteConfirmId(null)
      await reload(mangakaId)
    }
  }

  const filtered =
    statusFilter === 'All' ? proposals : proposals.filter((p) => p.status === statusFilter)

  const counts = {
    total: proposals.length,
    draft: proposals.filter((p) => p.status === 'Draft').length,
    pending: proposals.filter(
      (p) => p.status === 'Pending Review' || p.status === 'Under Review',
    ).length,
    approved: proposals.filter((p) => p.status === 'Approved').length,
    rejected: proposals.filter((p) => p.status === 'Rejected').length,
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
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
              <span>Proposal in review — blocked</span>
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

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, icon: BookOpen, color: 'text-foreground' },
          { label: 'In Review', value: counts.pending, icon: Clock, color: 'text-amber-600' },
          { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
          >
            <div className={`${color} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* warning banner */}
      {isBlocked && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-lg text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-600">You have an active proposal in review</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              You may only submit a new proposal once the current one (status: Pending Review or Under
              Review) has been resolved by the Editorial Board.
            </p>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {ALL_STATUSES.map((s) => {
          const count = s === 'All' ? proposals.length : proposals.filter((p) => p.status === s).length
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${statusFilter === s
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
            >
              {s} <span className="opacity-70 ml-1">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Proposal List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-16 text-center space-y-4">
          <PencilLine className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <div>
            <h3 className="font-bold text-lg text-foreground">
              {statusFilter === 'All' ? 'No proposals yet' : `No ${statusFilter} proposals`}
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
      )}

      {/* Delete confirm modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-bold text-base">Delete Draft?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This draft proposal will be permanently removed. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 text-sm font-bold bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
