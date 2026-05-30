'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PenTool,
  Plus,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileEdit,
  AlertTriangle,
  Layers,
  ClipboardList,
  Sparkles,
  TrendingUp,
  CalendarDays,
  Eye,
} from 'lucide-react'
import {
  getProposalsByMangaka,
  hasPendingProposal,
  type Proposal,
  type ProposalStatus,
} from '@/lib/proposals-store'

const MOCK_MANGAKA_ID = 'U01'
const MANGAKA_NAME = 'Tanaka Yuki'

const STATUS_CONFIG: Record<ProposalStatus, { label: string; className: string; icon: React.ElementType }> = {
  Draft: { label: 'Draft', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: FileEdit },
  'Pending Review': { label: 'Pending Review', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  'Under Review': { label: 'Under Review', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Eye },
  Approved: { label: 'Approved', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  Rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MangakaDashboardPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setProposals(getProposalsByMangaka(MOCK_MANGAKA_ID))
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isBlocked = hasPendingProposal(MOCK_MANGAKA_ID)
  const recent = [...proposals].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3)

  const counts = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === 'Draft').length,
    pending: proposals.filter(p => p.status === 'Pending Review' || p.status === 'Under Review').length,
    approved: proposals.filter(p => p.status === 'Approved').length,
    rejected: proposals.filter(p => p.status === 'Rejected').length,
  }

  return (
    <div className="space-y-8">

      {/* Welcome header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-3xl p-7">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3" /> Mangaka Portal
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Welcome back, {MANGAKA_NAME}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your series proposals and track their review status.
            </p>
          </div>

          {isBlocked ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs font-semibold text-amber-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
              Proposal in review — new submission blocked
            </div>
          ) : (
            <Link
              href="/dashboard/series/new"
              className="inline-flex items-center gap-2 shrink-0 bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-xl shadow-sm shadow-primary/15 hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Proposal
            </Link>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Proposals', value: counts.total, icon: PenTool, color: 'text-foreground', bg: 'bg-primary/8' },
          { label: 'In Review', value: counts.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/8' },
          { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/8' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Proposals */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm">Recent Proposals</h2>
            </div>
            <Link
              href="/dashboard/series"
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recent.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <PenTool className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No proposals yet</p>
                <Link
                  href="/dashboard/series/new"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Create your first proposal
                </Link>
              </div>
            ) : (
              recent.map((p) => {
                const config = STATUS_CONFIG[p.status]
                const StatusIcon = config.icon
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                    {/* Left accent */}
                    <div className={`w-1 h-10 rounded-full shrink-0 ${p.status === 'Approved' ? 'bg-emerald-500' :
                        p.status === 'Rejected' ? 'bg-red-500' :
                          p.status === 'Under Review' ? 'bg-blue-500' :
                            p.status === 'Pending Review' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">{p.id}</span>
                        <span className="text-muted-foreground/30">•</span>
                        <CalendarDays className="w-3 h-3 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground">
                          {formatDateShort(p.submittedAt ?? p.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${config.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Quick Actions
          </h2>

          <div className="space-y-3">
            {[
              {
                href: '/dashboard/series/new',
                icon: Plus,
                label: 'New Series Proposal',
                desc: 'Pitch a new manga concept to the Editorial Board',
                color: 'text-primary',
                bg: 'bg-primary/10',
                disabled: isBlocked,
              },
              {
                href: '/dashboard/series',
                icon: PenTool,
                label: 'My Proposals',
                desc: 'View & manage all your submitted proposals',
                color: 'text-violet-600',
                bg: 'bg-violet-500/10',
                disabled: false,
              },
              {
                href: '/dashboard/manuscripts',
                icon: Layers,
                label: 'Manuscripts',
                desc: 'Submit chapter manuscripts for editor review',
                color: 'text-amber-600',
                bg: 'bg-amber-500/10',
                disabled: false,
              },
              {
                href: '/dashboard/chapters',
                icon: ClipboardList,
                label: 'Tasks & Chapters',
                desc: 'Manage page tasks assigned to your assistants',
                color: 'text-cyan-600',
                bg: 'bg-cyan-500/10',
                disabled: false,
              },
            ].map(({ href, icon: Icon, label, desc, color, bg, disabled }) => (
              disabled ? (
                <div
                  key={label}
                  className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl opacity-50 cursor-not-allowed"
                >
                  <div className={`w-9 h-9 ${bg} ${color} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                    <p className="text-[10px] text-amber-500 font-semibold mt-1">⚠ Blocked by BR-19</p>
                  </div>
                </div>
              ) : (
                <Link
                  key={label}
                  href={href}
                  className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/25 hover:bg-accent/30 hover:shadow-sm transition-all group"
                >
                  <div className={`w-9 h-9 ${bg} ${color} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </Link>
              )
            ))}
          </div>

          {/* BR-19 warning */}
          {isBlocked && (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/8 border border-amber-500/20 rounded-xl text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-600">Proposal in review (BR-19)</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">
                  New proposals are blocked until your current one is resolved by the Editorial Board.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
