'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Clock,
  FileArchive,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { manuscriptService } from '@/services/manuscriptService'
import { chapterService } from '@/services/chapterService'
import type { ManuscriptItem, Annotation } from '@/types/manuscript'
import { ImageCommentLayer } from '@/components/annotations/image-comment-layer'

interface EditorManuscriptsTabProps {
  manuscripts: ManuscriptItem[]
  supervisedSeries: any[]
  onRefresh: () => void
}

export default function EditorManuscriptsTab({
  manuscripts,
  supervisedSeries,
  onRefresh
}: EditorManuscriptsTabProps) {
  const [activeManuscriptId, setActiveManuscriptId] = useState<string | null>(null)
  const [newAnnotationText, setNewAnnotationText] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  const activeManuscript = useMemo(() => {
    return manuscripts.find((m) => m.id === activeManuscriptId)
  }, [manuscripts, activeManuscriptId])

  useEffect(() => {
    if (activeManuscript) {
      setAnnotations(manuscriptService.getAnnotations(activeManuscript.id, activeManuscript.latestVersion))
      manuscriptService.syncAnnotationsFromBackend(activeManuscript.id)
        .then((synced) => {
          if (synced) setAnnotations(synced)
        })
        .catch((e) => console.warn(e))
    }
  }, [activeManuscript])

  const handleOpenReview = (id: string) => {
    setActiveManuscriptId(id)
    setNewAnnotationText('')
    setFeedbackText('')
  }

  const handleBackToManuscripts = () => {
    setActiveManuscriptId(null)
    onRefresh()
  }

  const handleAddAnnotationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeManuscript || !newAnnotationText.trim()) return

    manuscriptService.addAnnotation(
      activeManuscript.id,
      activeManuscript.latestVersion,
      1,
      0.5,
      0.5,
      newAnnotationText.trim()
    ).then((ann) => {
      setAnnotations((prev) => [...prev, ann])
      setNewAnnotationText('')
      toast.success('Annotation added to this version draft!')
    }).catch((err) => {
      toast.error(err.message || 'Failed to add annotation')
    })
  }

  const handleAddImageAnnotation = async (
    pageNo: number,
    x: number,
    y: number,
    text: string
  ) => {
    if (!activeManuscript) return

    const ann = await manuscriptService.addAnnotation(
      activeManuscript.id,
      activeManuscript.latestVersion,
      pageNo,
      x,
      y,
      text
    )

    setAnnotations((prev) => [...prev, ann])
    toast.success('Annotation added!')
  }

  const handleDecision = async (status: 'APPROVED' | 'REVISION REQUIRED') => {
    if (!activeManuscript) return

    if (status === 'APPROVED' && activeManuscript.progress < 100) {
      toast.error(
        `Chapter drawing progress is only ${activeManuscript.progress}%. Must be 100% to approve.`
      )
      return
    }

    try {
      const success = await manuscriptService.updateManuscriptStatus(
        activeManuscript.id,
        status,
        feedbackText.trim()
      )
      if (success) {
        if (status === 'APPROVED') {
          toast.success(`Manuscript for "${activeManuscript.seriesTitle}" approved and locked!`)
        } else {
          toast.warning(
            `Revision requested for "${activeManuscript.seriesTitle}". Status updated.`
          )
        }
        handleBackToManuscripts()
      } else {
        toast.error('Failed to update manuscript review status.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update manuscript review status.')
    }
  }

  const handlePublishManuscript = async (manuscript: ManuscriptItem) => {
    try {
      const success = await manuscriptService.updateManuscriptStatus(
        manuscript.id,
        'PUBLISHED',
        'Manuscript published.'
      )

      if (success) {
        await chapterService.updateChapter(manuscript.chapterId, { status: 'Published' })
        toast.success(`Manuscript for "${manuscript.seriesTitle}" published.`)
        handleBackToManuscripts()
      } else {
        toast.error('Failed to publish manuscript.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish manuscript.')
    }
  }

  const filteredManuscripts = manuscripts.filter((m) =>
    supervisedSeries.some((s) => s.id === m.seriesId)
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {activeManuscript ? (
        /* Detailed Manuscript Review View */
        <div className="space-y-6">
          {/* Back header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToManuscripts}
                className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all cursor-pointer"
                title="Back to List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-black text-foreground">
                  Reviewing: {activeManuscript.seriesTitle}
                </h2>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                  Chapter {activeManuscript.chapterNumber}: "{activeManuscript.chapterTitle}" • Version {activeManuscript.latestVersion}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs bg-muted/40 px-3 py-1.5 rounded-lg border border-border/60 text-muted-foreground font-bold">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                Completion: <strong>{activeManuscript.progress}%</strong>
              </span>
            </div>
          </div>

          {/* Grid: Storyboard Page preview + annotations + decisions */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left side: previews & annotations */}
            <div className="xl:col-span-2 space-y-5">
              <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                Manuscript File Attachment
              </h3>

              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-6 space-y-4">
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
                    <ImageCommentLayer
                      imageUrl={activeManuscript.fileUrl}
                      pageNo={1}
                      annotations={annotations}
                      onAddAnnotation={handleAddImageAnnotation}
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
              </div>

              {/* Annotations */}
              <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground">
                    Annotations
                  </h4>
                  <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/65">
                    Locked to {activeManuscript.latestVersion}
                  </span>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {annotations.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No annotations added to this version yet.
                    </p>
                  ) : (
                    annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-3 bg-muted/30 border border-border/30 rounded-lg space-y-1 text-xs"
                      >
                        <p className="text-foreground font-semibold">{ann.text}</p>
                        <p className="text-[9px] text-muted-foreground/60">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Annotation Form */}
                <form onSubmit={handleAddAnnotationSubmit} className="flex gap-2 pt-2 border-t border-border/30">
                  <input
                    type="text"
                    placeholder="Type storyboard annotations..."
                    value={newAnnotationText}
                    onChange={(e) => setNewAnnotationText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs focus:outline-none focus:border-primary/40 text-foreground"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground font-extrabold text-xs rounded-lg px-4 hover:bg-primary/95 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            {/* Right side: Evaluation Decisions */}
            <div className="space-y-5">
              <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                Evaluation Panel
              </h3>
              <div className="bg-card border border-border p-5 rounded-xl space-y-5 shadow-sm">
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">
                    Submit Review Outcome
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Evaluate the manuscript storyboard draft. Approvals lock the manuscript and prepare it for publication.
                  </p>
                </div>

                {/* BR-84 Warning banner if progress < 100% */}
                {activeManuscript.progress < 100 && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-600 rounded-lg text-xs font-bold leading-normal">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Warning: Chapter drawing progress is only {activeManuscript.progress}%. Approval is disabled until it reaches 100%.
                    </span>
                  </div>
                )}

                {/* Editorial Feedback */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">
                    Feedback Message
                  </label>
                  <textarea
                    placeholder="Write feedback comments for the mangaka..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-muted/30 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 text-foreground resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 gap-2">
                  {activeManuscript.status === 'APPROVED' ? (
                    <button
                      onClick={() => handlePublishManuscript(activeManuscript)}
                      className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <FileCheck className="w-4 h-4" /> Publish Manuscript
                    </button>
                  ) : activeManuscript.status === 'PUBLISHED' ? (
                    <div className="w-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Published
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDecision('APPROVED')}
                        disabled={activeManuscript.progress < 100}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve & Lock
                      </button>
                      <button
                        onClick={() => handleDecision('REVISION REQUIRED')}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <AlertTriangle className="w-4 h-4" /> Request Revision
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Manuscripts List View */
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-foreground">Manuscripts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage manuscript submissions and editorial reviews
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredManuscripts.map((m) => {
              const latestVer = m.history?.[0] || {
                version: m.latestVersion,
                status: m.status,
                submittedAt: new Date().toISOString(),
              }

              return (
                <div
                  key={m.id}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-6 space-y-4 hover:border-primary/20 transition-all"
                >
                  {/* Header details */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-foreground">
                          {m.seriesTitle} — Ch.{m.chapterNumber} "{m.chapterTitle}"
                        </h3>
                        <span className="text-[10px] font-mono bg-muted border border-border/80 text-muted-foreground px-1.5 py-0.5 rounded">
                          {m.id}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                        Latest Version: <span className="text-foreground">{m.latestVersion}</span> • Cycles: {m.history?.length || 1}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full border ${m.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : m.status === 'PUBLISHED'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : m.status === 'REVISION REQUIRED'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse'
                          }`}
                      >
                        {m.status}
                      </span>

                      {m.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleOpenReview(m.id)}
                          className="bg-primary hover:bg-primary/95 text-primary-foreground font-black text-[10px] uppercase tracking-wide px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
                        >
                          Review
                        </button>
                      )}
                      {m.status === 'APPROVED' && (
                        <button
                          onClick={() => handlePublishManuscript(m)}
                          className="bg-primary hover:bg-primary/95 text-primary-foreground font-black text-[10px] uppercase tracking-wide px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
                        >
                          Publish
                        </button>
                      )}
                      {m.status === 'PUBLISHED' && (
                        <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black text-[10px] uppercase tracking-wide px-3.5 py-1.5 rounded-lg">
                          Published
                        </span>
                      )}
                    </div>
                  </div>

                  {/* History cycle list inside card */}
                  <div className="space-y-2.5 pt-3.5 border-t border-border/40">
                    {m.history?.map((h, hIdx) => (
                      <div
                        key={hIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/30 border border-border/30 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-black text-foreground">{h.version}</span>
                          <span
                            className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${h.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : h.status === 'PUBLISHED'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : h.status === 'REVISION REQUIRED'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                              }`}
                          >
                            {h.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            Submitted: {new Date(h.submittedAt).toLocaleDateString()}
                          </span>
                          {h.reviewedAt && (
                            <span className="text-[10px] text-muted-foreground/60">
                              Reviewed: {new Date(h.reviewedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {h.revisionNumber && (
                          <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-black text-[9px] rounded px-2 py-0.5">
                            REV #{h.revisionNumber}/3
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Latest Editor Feedback */}
                    {latestVer.feedback && (
                      <div className="bg-muted/40 p-4 rounded-lg border border-border/40 text-xs">
                        <p className="text-[9px] font-extrabold text-primary uppercase tracking-wider">
                          Editor Feedback:
                        </p>
                        <p className="text-muted-foreground mt-1 italic leading-normal">
                          "{latestVer.feedback}"
                        </p>
                      </div>
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
