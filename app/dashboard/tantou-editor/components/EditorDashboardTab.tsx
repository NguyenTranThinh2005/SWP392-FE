'use client'

import Link from 'next/link'
import {
  BookOpen,
  FileCheck,
  FileText,
  ChevronRight,
  PencilLine,
  Sparkles,
  Users
} from 'lucide-react'

interface EditorDashboardTabProps {
  supervisedSeries: any[]
  assignedMangakas: { id: string; name: string; email: string }[]
  stats: { seriesCount: number; pendingCount: number }
}

export default function EditorDashboardTab({
  supervisedSeries,
  assignedMangakas,
  stats
}: EditorDashboardTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-black text-foreground">Tổng quan</h2>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/tantou-editor?tab=series"
          className="bg-card border border-border hover:border-primary/20 p-6 rounded-xl flex items-center gap-4 transition-all shadow-sm group cursor-pointer"
        >
          <div className="text-primary group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Series của tôi</p>
            <p className="text-2xl font-black text-foreground leading-none mt-1">
              {stats.seriesCount}
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/tantou-editor?tab=manuscripts"
          className="bg-card border border-border hover:border-primary/20 p-6 rounded-xl flex items-center gap-4 transition-all shadow-sm group cursor-pointer"
        >
          <div className="text-amber-600 group-hover:scale-105 transition-transform">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold font-sans">
              Đang chờ đánh giá
            </p>
            <p className="text-2xl font-black text-foreground leading-none mt-1">
              {stats.pendingCount}
            </p>
          </div>
        </Link>
      </div>

      {/* Double Column content: Recent Proposals and Series Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left side: Recent Proposals */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Recent Proposals
            </h3>
            <Link
              href="/dashboard/tantou-editor?tab=proposals"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/30">
            {supervisedSeries.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">
                No proposals submitted yet.
              </p>
            ) : (
              [...supervisedSeries]
                .sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime())
                .slice(0, 5)
                .map((proposal) => {
                  return (
                    <div
                      key={proposal.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground">
                          {proposal.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center">
                          <PencilLine className="w-3 h-3 mr-1 text-primary shrink-0" /> Mangaka: {proposal.author} · {proposal.type || 'Weekly'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-muted-foreground">
                          {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : (proposal.status === 'Draft' ? 'Draft' : 'N/A')}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${proposal.status === 'Approved' || proposal.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : proposal.status === 'Proposed'
                              ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                              : proposal.status === 'Under Review' || proposal.status === 'UnderReview'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}
                        >
                          {proposal.status || 'Proposed'}
                        </span>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        {/* Right side column: Assigned Mangakas & Series Overview */}
        <div className="space-y-6">
          {/* Assigned Mangakas List Card */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Assigned Mangakas
              </h3>
            </div>

            <div className="divide-y divide-border/30">
              {assignedMangakas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-6 text-center">
                  No mangakas assigned.
                </p>
              ) : (
                assignedMangakas.map((mangaka) => (
                  <div
                    key={mangaka.id}
                    className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">
                        {mangaka.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate">
                        {mangaka.email}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">
                      Active
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Series Overview */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Series Overview
              </h3>
              <Link
                href="/dashboard/tantou-editor?tab=series"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-border/30">
              {supervisedSeries.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-6 text-center">
                  No series assigned.
                </p>
              ) : (
                supervisedSeries.slice(0, 5).map((series) => (
                  <div
                    key={series.id}
                    className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">
                        {series.title}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate">
                        {series.genre?.join(', ') || 'No genre'} ·{' '}
                        {series.type || 'Weekly'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      {series.rating && (
                        <span className="text-[10px] font-bold text-sky-500 bg-sky-500/5 px-2 py-0.5 rounded-md border border-sky-500/10">
                          {series.rating}% Score
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${series.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                      >
                        {series.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
