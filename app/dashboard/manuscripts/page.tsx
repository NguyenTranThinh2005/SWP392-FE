'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRole } from '@/context/RoleContext'
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  MessageSquare,
  Plus,
  BookOpen,
  ChevronRight,
  FileCheck,
  Lock,
  ChevronDown,
  FileArchive,
  Download,
  FileText,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

import { manuscriptService } from '@/services/manuscriptService'
import type { ManuscriptItem } from '@/types/manuscript'

export default function ManuscriptsPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)

  // Page States
  const [manuscripts, setManuscripts] = useState<ManuscriptItem[]>([])
  const [activeManuscriptId, setActiveManuscriptId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED'>('ALL')
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('ALL')

  // Review Panel States
  const [feedbackText, setFeedbackText] = useState('')

  // Load data from store
  useEffect(() => {
    setMounted(true)
    setManuscripts(manuscriptService.getManuscripts())

    // Background sync from Backend
    manuscriptService.syncManuscriptsFromBackend().then((synced) => {
      setManuscripts(synced)
    })
  }, [])

  // Sync annotations when active manuscript changes
  const activeManuscript = useMemo(() => {
    return manuscripts.find(m => m.id === activeManuscriptId)
  }, [manuscripts, activeManuscriptId])

  // Extract unique series from manuscripts list
  const uniqueSeriesList = useMemo(() => {
    const map = new Map<string, string>()
    manuscripts.forEach(m => {
      if (m.seriesId && m.seriesTitle) {
        map.set(m.seriesId, m.seriesTitle)
      }
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [manuscripts])

  const filteredManuscripts = useMemo(() => {
    let result = manuscripts
    if (activeTab !== 'ALL') {
      result = result.filter(m => m.status === activeTab)
    }
    if (selectedSeriesId !== 'ALL') {
      result = result.filter(m => m.seriesId === selectedSeriesId)
    }
    return result
  }, [manuscripts, activeTab, selectedSeriesId])

  // Is authorized editor (Tantou Editor)
  const isTantouEditor = useMemo(() => {
    return role === 'TantouEditor'
  }, [role])

  const handleOpenReview = (id: string) => {
    setActiveManuscriptId(id)
    setFeedbackText('')
  }

  const handleBackToList = () => {
    setActiveManuscriptId(null)
    setManuscripts(manuscriptService.getManuscripts())
  }

  // aandle decision outcomes (, )
  const handleDecision = (status: 'APPROVED' | 'REVISION REQUIRED') => {
    if (!activeManuscript) return

    // Guard: Cannot approve if chapter drawing progress < 100%
    if (status === 'APPROVED' && activeManuscript.progress < 100) {
      toast.error(`Violation: Chapter drawing progress is only ${activeManuscript.progress}%. Must be 100% to approve.`)
      return
    }

    manuscriptService.updateManuscriptStatus(activeManuscript.id, status, feedbackText.trim()).then((success) => {
      if (success) {
        if (status === 'APPROVED') {
          toast.success(`Manuscript for "${activeManuscript.seriesTitle}" approved and locked!`)
        } else {
          toast.warning(`Revision requested for "${activeManuscript.seriesTitle}". Draft status updated to Revision Required.`)
        }
        handleBackToList()
      } else {
        toast.error('Failed to update manuscript review status.')
      }
    }).catch((err) => {
      toast.error(err.message || 'Failed to update manuscript review status.')
    })
  }

  const formatDateShort = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!mounted) return null

  return (

    <div className="space-y-6">
      {/* If Reviewing a Specific Manuscript (Image 2 View) */}
      {activeManuscript ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* aeader & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToList}
                className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all cursor-pointer"
                title="Back to List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                  Reviewing: {activeManuscript.seriesTitle}
                </h1>
                <p className="text-xs text-muted-foreground font-semibold">
                  Chapter {activeManuscript.chapterNumber}: "{activeManuscript.chapterTitle}" • Version {activeManuscript.latestVersion}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs bg-muted px-3 py-1.5 rounded-lg border border-border/80 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Progress: <strong>{activeManuscript.progress}%</strong></span>
            </div>
          </div>

          {/* Grid Layout: Left Storyboards, Right Review panel */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column: Manuscript File */}
            <div className="xl:col-span-2 space-y-4">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Manuscript File Attachment</h2>

              <Card className="border-border bg-card p-6 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FileArchive className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Submitted Manuscript (Manuscript File)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Attached file from Mangaka for version {activeManuscript.latestVersion}
                    </p>
                  </div>
                </div>

                {activeManuscript.fileUrl ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeManuscript.fileUrl}
                      alt="Submitted Manuscript"
                      className="w-full rounded-lg border border-border/85 object-contain max-h-[700px] mx-auto"
                    />
                    <div className="p-4 bg-muted/30 border border-border/80 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {activeManuscript.fileUrl.split('/').pop() || 'manuscript_file'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          URL: {activeManuscript.fileUrl}
                        </p>
                      </div>
                      <a
                        href={activeManuscript.fileUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 py-2 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-extrabold rounded-lg transition-all shadow-sm flex-shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                      >
                        <Download className="w-4 h-4" /> Download Manuscript
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs text-amber-600 font-medium">
                    No file link found for this version.
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Decisions Section */}
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Evaluation Decisions</h2>

              <Card className="border-border bg-card p-5 rounded-xl space-y-5 shadow-sm">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground">Review Decision</h3>
                  <p className="text-xs text-muted-foreground">
                    Evaluate drawing progress, annotations, and storyboard files. Note: Approvals lock the manuscript and cannot be undone.
                  </p>
                </div>

                {/* Warning Banner */}
                {activeManuscript.progress < 100 && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-500 rounded-lg text-xs leading-relaxed font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Alert: Cannot approve — chapter completion is {activeManuscript.progress}%, must be 100%</span>
                  </div>
                )}

                {/* Feedback Comment box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Editorial Feedback</label>
                  <textarea
                    placeholder="Provide feedback..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-muted/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground resize-none"
                  />
                </div>

                {/* Actions buttons */}
                {isTantouEditor ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    <Button
                      onClick={() => handleDecision('APPROVED')}
                      disabled={activeManuscript.progress < 100}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve (Lock)
                    </Button>
                    <Button
                      onClick={() => handleDecision('REVISION REQUIRED')}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" /> Request Revision
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted border border-border/80 rounded-lg text-[10px] text-muted-foreground text-center font-medium leading-relaxed">
                      🔒 <strong>View-only mode:</strong> Only the assigned Tantou Editor (Nakamura Takeshi) can approve or request revisions.
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 opacity-50">
                      <Button disabled className="w-full bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-lg">
                        Approve (Lock)
                      </Button>
                      <Button disabled className="w-full bg-amber-600 text-white text-xs font-bold py-2.5 rounded-lg">
                        Request Revision
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Manuscripts List View (Image 1 View) */
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <Layers className="w-8 h-8 text-primary" />
                Manuscripts Review
              </h1>
            </div>
          </div>

          {/* Tabs & Filters bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border gap-4 pb-2 sm:pb-0">
            {/* Status Tabs Menu */}
            <div className="flex overflow-x-auto">
              {[
                { id: 'ALL', label: 'All Manuscripts' },
                { id: 'SUBMITTED', label: 'Pending Review' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'REVISION REQUIRED', label: 'Revision Required' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Series Filter Dropdown */}
            <div className="relative shrink-0 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-xs mr-2 self-start sm:self-auto">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground font-bold">Manga:</span>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer pr-4"
              >
                <option value="ALL">All Series</option>
                {uniqueSeriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredManuscripts.map((m) => {
              const latestVer = m.history[0]

              // Status colors styling
              const getBadgeColor = (status: string) => {
                switch (status) {
                  case 'APPROVED': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20'
                  case 'PUBLISHED': return 'bg-primary/10 text-primary border border-primary/20'
                  case 'SUBMITTED': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border border-indigo-500/20'
                  case 'REVISION REQUIRED': return 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20'
                  default: return 'bg-muted text-muted-foreground border-border'
                }
              }

              return (
                <div
                  key={m.id}
                  className="bg-card border border-border overflow-hidden hover:border-primary/25 hover:shadow-lg transition-all p-5 rounded-xl flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3
                        onClick={() => handleOpenReview(m.id)}
                        className="font-extrabold text-sm text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1"
                        title={m.seriesTitle}
                      >
                        {m.seriesTitle}
                      </h3>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold shrink-0 border whitespace-nowrap ${getBadgeColor(m.status)}`}>
                        {m.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-muted-foreground font-semibold truncate">
                      Ch. {m.chapterNumber}: "{m.chapterTitle}"
                    </p>

                    <p className="text-[9px] text-muted-foreground/80 pt-1 border-t border-border/40">
                      Latest: <span className="font-semibold text-foreground">{m.latestVersion}</span> • Total cycles: {m.history.length}
                    </p>

                    {/* Compact version list history */}
                    <div className="space-y-1 max-h-20 overflow-y-auto pt-1">
                      {m.history.slice(0, 2).map((h, hIdx) => (
                        <div key={hIdx} className="flex items-center justify-between gap-1 text-[9px] bg-muted/40 px-1.5 py-0.5 rounded">
                          <span className="font-bold text-foreground/85">{h.version}</span>
                          <span className="text-muted-foreground/60 scale-95 shrink-0">{formatDateShort(h.submittedAt)}</span>
                        </div>
                      ))}
                      {m.history.length > 2 && (
                        <div className="text-[8px] text-muted-foreground/60 italic text-center">
                          +{m.history.length - 2} more versions
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-border/40">
                    {m.status === 'SUBMITTED' ? (
                      <Button
                        onClick={() => handleOpenReview(m.id)}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] h-8 py-1 rounded-lg cursor-pointer transition-colors"
                      >
                        <FileCheck className="w-3 h-3 mr-1" /> Review
                      </Button>
                    ) : m.status === 'APPROVED' ? (
                      <Button
                        onClick={() => handleOpenReview(m.id)}
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-foreground font-bold text-[10px] h-8 py-1 rounded-lg cursor-pointer border border-border/40 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Approved
                      </Button>
                    ) : m.status === 'PUBLISHED' ? (
                      <Button
                        onClick={() => handleOpenReview(m.id)}
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-foreground font-bold text-[10px] h-8 py-1 rounded-lg cursor-pointer border border-border/40 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Published
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleOpenReview(m.id)}
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-foreground font-bold text-[10px] h-8 py-1 rounded-lg cursor-pointer border border-border/40 transition-colors flex items-center justify-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Revision
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}