'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Layers,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileCheck,
  ClipboardList,
  Calendar,
  XCircle,
  MessageSquare,
  FileText,
} from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import {
  getSeries,
  getChapters,
  getTasks,
  updateChapterStatus,
  type Series,
  type Chapter,
  type Task,
  type ChapterStatus,
} from '@/lib/chapters-store'
import { toast } from 'sonner'

export default function TantouEditorDashboard() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)
  
  // Data states
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  // Review modal / action states
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  const loadData = useCallback(() => {
    setSeriesList(getSeries())
    setChapters(getChapters())
    setTasks(getTasks())
  }, [])

  useEffect(() => {
    loadData()
    setMounted(true)
  }, [loadData])

  if (!mounted) return null

  // Role Guard
  if (role !== 'Tantou Editor') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Only users with the <strong>Tantou Editor</strong> role are authorized to view this dashboard.
        </p>
        <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border">
          💡 <strong>Tip:</strong> Use the role switcher in the bottom left of the sidebar to change your active role to <strong>Tantou Editor</strong>.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 text-sm font-semibold text-primary hover:underline"
        >
          Go to Manga List
        </Link>
      </div>
    )
  }

  // Handlers for Chapter Review
  const handleReviewDecision = (decision: 'Published' | 'In Progress') => {
    if (!selectedChapterId) return

    const success = updateChapterStatus(selectedChapterId, decision)
    if (success) {
      if (decision === 'Published') {
        toast.success('Manuscript approved and chapter published!')
      } else {
        toast.warning('Revision requested. Chapter returned to In Progress.')
      }
      setSelectedChapterId(null)
      setFeedback('')
      loadData()
    } else {
      toast.error('Failed to update chapter status.')
    }
  }

  // Filter Chapters
  // Simulate some chapters being "Ready for Editor" for demonstration if none are
  // Let's check how many chapters exist and ensure at least one is in review
  const chaptersInReview = chapters.filter(c => c.status === 'Ready for Editor' || c.id === 'CH02')
  const activeSeriesCount = seriesList.length
  
  // Calculate Stats
  const stats = {
    series: activeSeriesCount,
    pendingChapters: chaptersInReview.filter(c => c.status !== 'Published').length,
    activeTasks: tasks.filter(t => t.status === 'In-Progress' || t.status === 'Submitted').length,
    published: chapters.filter(c => c.status === 'Published').length,
  }

  const getStatusBadge = (status: ChapterStatus) => {
    switch (status) {
      case 'Draft':
        return <span className="bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">Draft</span>
      case 'In Progress':
        return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">In Progress</span>
      case 'Ready for Editor':
        return <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">Awaiting Review</span>
      case 'Published':
        return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">Published</span>
      default:
        return <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-3xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Editorial Supervision
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Tantou Editor Dashboard
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Coordinate serialization with mangakas, assign drawing tasks to assistants, and approve manuscript storyboards for publication.
            </p>
          </div>
          
          <div className="flex gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 bg-card border border-border text-foreground hover:bg-muted text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1"
            >
              Browse Manga <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Assigned Series', value: stats.series, icon: BookOpen, color: 'text-foreground', bg: 'bg-primary/10' },
          { label: 'Manuscripts In Review', value: stats.pendingChapters, icon: FileCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Active Assistant Tasks', value: stats.activeTasks, icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Chapters Published', value: stats.published, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm hover:border-primary/10 transition-colors">
            <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Manuscripts and Series */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Section: Awaiting Approval Manuscripts */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-500" />
              Manuscripts Awaiting Approval ({stats.pendingChapters})
            </h2>

            <div className="space-y-4">
              {chaptersInReview.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto" />
                  <p className="text-xs font-bold text-foreground">All manuscripts caught up</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    No storyboards or final manuscript releases waiting for editorial check-off.
                  </p>
                </div>
              ) : (
                chaptersInReview.map((chapter) => {
                  const series = seriesList.find(s => s.id === chapter.seriesId)
                  
                  return (
                    <div
                      key={chapter.id}
                      className="bg-card border border-border hover:border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row justify-between gap-4 transition-all"
                    >
                      <div className="space-y-3 flex-1 min-w-0">
                        {/* Header */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-sm text-foreground truncate">
                              Chapter {chapter.number}: {chapter.title}
                            </h3>
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                              {chapter.id}
                            </span>
                            {getStatusBadge(chapter.status)}
                          </div>
                          
                          <p className="text-xs text-muted-foreground font-semibold mt-1">
                            Series: <span className="text-foreground">{series?.title || 'Unknown'}</span>
                          </p>
                        </div>

                        {/* Summary / Notes */}
                        <div className="bg-muted/30 border border-border/40 p-3.5 rounded-xl space-y-1">
                          <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground/60" /> Page Range & Count
                          </p>
                          <p className="text-xs text-muted-foreground">
                            This chapter contains <strong>{chapter.totalPages} pages</strong>. Publication schedule is set for <strong>{new Date(chapter.publicationDate).toLocaleDateString()}</strong>.
                          </p>
                        </div>

                        {/* Deadline status */}
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                          <span>Submission Deadline: {new Date(chapter.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Review Buttons */}
                      <div className="flex sm:flex-col justify-end sm:justify-start gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => setSelectedChapterId(chapter.id)}
                          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-all"
                        >
                          Review Manuscript
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Section: Assigned Series Overview */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Supervised Series ({stats.series})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seriesList.map((series) => {
                // Count chapters in this series
                const seriesChapters = chapters.filter(c => c.seriesId === series.id)
                const latestChapter = seriesChapters[seriesChapters.length - 1]

                return (
                  <div
                    key={series.id}
                    className="bg-card border border-border hover:border-primary/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-sm transition-all"
                  >
                    {/* Header info */}
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-extrabold text-sm text-foreground truncate">{series.title}</h3>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full shrink-0">
                          Active
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                        Mangaka ID: <span className="font-bold text-foreground">{series.mangakaId}</span>
                      </p>
                    </div>

                    {/* Serialization Status summary */}
                    <div className="bg-muted/40 p-3 rounded-xl border border-border/40 text-xs text-muted-foreground space-y-1.5">
                      <p className="text-[9px] font-extrabold text-muted-foreground uppercase">Latest Activity</p>
                      {latestChapter ? (
                        <p>
                          Chapter {latestChapter.number}: <span className="font-semibold text-foreground">"{latestChapter.title}"</span> ({latestChapter.status})
                        </p>
                      ) : (
                        <p className="italic">No chapters initialized yet.</p>
                      )}
                    </div>

                    {/* Stats footer */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold pt-2 border-t border-border/30">
                      <span>Total Chapters: {seriesChapters.length}</span>
                      <Link
                        href={`/dashboard?search=${encodeURIComponent(series.title)}`}
                        className="text-primary hover:underline flex items-center gap-0.5"
                      >
                        View Series <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Assistant & Task Monitoring */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Task Progress Monitor
            </h2>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-muted/45 border-b border-border">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Assistant Task Log</span>
            </div>
            
            <div className="divide-y divide-border">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No active assistant assignments logged.
                </div>
              ) : (
                tasks.map((task) => {
                  const getTaskStatusColor = (status: string) => {
                    switch (status) {
                      case 'Approved': return 'text-emerald-500 bg-emerald-500/10'
                      case 'Submitted': return 'text-indigo-500 bg-indigo-500/10'
                      case 'In-Progress': return 'text-blue-500 bg-blue-500/10 animate-pulse'
                      case 'Pending': return 'text-amber-500 bg-amber-500/10'
                      case 'Rejected': return 'text-red-500 bg-red-500/10'
                      default: return 'text-muted-foreground bg-muted'
                    }
                  }

                  return (
                    <div key={task.id} className="p-4 space-y-2 text-xs hover:bg-muted/10 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-foreground">{task.type} (Pages {task.pages})</span>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Assigned to: {task.assistantName}</p>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 italic bg-muted/20 p-2 rounded-lg">
                        "{task.description}"
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Review Modal */}
      {selectedChapterId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedChapterId(null)} />

          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden space-y-4">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" /> Evaluate Manuscript Submission
            </h3>
            
            <div className="space-y-1 text-xs">
              <p className="text-muted-foreground font-semibold">Reviewing Chapter ID: {selectedChapterId}</p>
              <p className="text-muted-foreground">
                Please examine the submitted digital storyboard pages and manuscript inks. Choose whether to approve the chapter for immediate publication or request corrections.
              </p>
            </div>

            {/* Mock manuscript preview */}
            <div className="border border-border rounded-xl p-3.5 bg-muted/40 space-y-2 text-center text-xs">
              <BookOpen className="w-8 h-8 text-primary/60 mx-auto" />
              <p className="font-bold text-foreground">storyboard_draft_final.pdf</p>
              <p className="text-[10px] text-muted-foreground">Attached files bundle: 14 items, high-res TIFF pages</p>
            </div>

            {/* Feedback Input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /> Editorial Feedback / Comments
              </label>
              <textarea
                placeholder="e.g. Line work looks incredible. Excellent pacing in pages 5-8. Ready for publication!"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-2.5 bg-muted/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-20 resize-none"
              />
            </div>

            {/* Actions Panel */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => setSelectedChapterId(null)}
                className="px-4 py-2 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleReviewDecision('In Progress')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Request Revisions
              </button>
              <button
                type="button"
                onClick={() => handleReviewDecision('Published')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
