'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  FileArchive,
  Download,
  XCircle,
  Search,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { seriesService, type SeriesProposal } from '@/services/seriesService'
import { API_BASE_URL } from '@/lib/constants'

const parseGenres = (genre: any): string[] => {
  if (!genre) return []
  if (Array.isArray(genre)) return genre.filter(Boolean)
  if (typeof genre === 'string') {
    if (genre.includes(',')) {
      return genre.split(',').map((s) => s.trim()).filter(Boolean)
    }
    const splitPascal = genre.match(/[A-Z][a-z0-9]*/g)
    if (splitPascal && splitPascal.length > 1) {
      return splitPascal
    }
    return [genre.trim()]
  }
  return []
}

interface EditorProposalsTabProps {
  supervisedSeries: any[]
  seriesList: any[]
  onRefresh: () => void
}

export default function EditorProposalsTab({
  supervisedSeries,
  seriesList,
  onRefresh
}: EditorProposalsTabProps) {
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [proposalFilter, setProposalFilter] = useState('All')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReasonText, setRejectReasonText] = useState('')

  const [detailedProposal, setDetailedProposal] = useState<SeriesProposal | null>(null)

  useEffect(() => {
    if (!selectedProposalId) {
      setDetailedProposal(null)
      return
    }
    let active = true
    const fetchDetail = async () => {
      try {
        const detail = await seriesService.getSeriesById(selectedProposalId)
        if (active) {
          setDetailedProposal(detail)
        }
      } catch (err) {
        console.error('Failed to fetch detailed proposal:', err)
      }
    }
    fetchDetail()
    return () => {
      active = false
    }
  }, [selectedProposalId])



  const getIntakeStatusBadge = (status: string) => {
    let bg = 'bg-gray-500/20';
    let dot = 'bg-gray-400';

    const normalizedStatus = (status || '').trim();

    if (normalizedStatus === 'Approved' || normalizedStatus === 'Active') {
      bg = 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20';
      dot = 'bg-emerald-500';
    } else if (normalizedStatus === 'Under Review' || normalizedStatus === 'UnderReview') {
      bg = 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/20';
      dot = 'bg-indigo-500';
    } else if (normalizedStatus === 'BoardVoting' || normalizedStatus === 'Board Voting') {
      bg = 'bg-blue-500/15 text-blue-600 border border-blue-500/20';
      dot = 'bg-blue-500';
    } else if (normalizedStatus === 'Proposed' || normalizedStatus === 'Pending Review' || normalizedStatus === 'PendingReview') {
      bg = 'bg-amber-500/15 text-amber-600 border border-amber-500/20';
      dot = 'bg-amber-500';
    } else if (normalizedStatus === 'Rejected') {
      bg = 'bg-red-500/15 text-red-600 border border-red-500/20';
      dot = 'bg-red-500';
    }

    const displayLabel = normalizedStatus === 'UnderReview' ? 'Under Review'
      : normalizedStatus === 'BoardVoting' ? 'Board Voting'
        : normalizedStatus === 'PendingReview' ? 'Pending Review'
          : normalizedStatus;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {displayLabel}
      </span>
    );
  };

  const filtered = useMemo(() => {
    return supervisedSeries.filter((p) => {
      // Always hide Draft proposals
      if ((p.status || '').toLowerCase() === 'draft') return false;

      const matchesSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.author || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (proposalFilter === 'All') return matchesSearch;

      const pStatus = (p.status || '').toLowerCase().replace(/[\s_]+/g, '');
      const filterVal = proposalFilter.toLowerCase().replace(/[\s_]+/g, '');

      if (filterVal === 'underreview') {
        return matchesSearch && ['proposed', 'pendingreview', 'underreview'].includes(pStatus);
      }
      if (filterVal === 'approved') {
        return matchesSearch && ['approved', 'active'].includes(pStatus);
      }
      if (filterVal === 'boardvoting') {
        return matchesSearch && ['boardvoting'].includes(pStatus);
      }

      return matchesSearch && pStatus === filterVal;
    });
  }, [supervisedSeries, searchQuery, proposalFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {selectedProposalId ? (
        /* Detailed Proposal Review View */
        (() => {
          const baseProposal = seriesList.find((s) => s.id === selectedProposalId)
          if (!baseProposal) return <p className="text-sm text-muted-foreground">Proposal not found.</p>

          const proposal: any = detailedProposal && detailedProposal.id === selectedProposalId
            ? detailedProposal
            : baseProposal


          const deadlineDate = proposal.submittedAt ? new Date(proposal.submittedAt) : new Date(proposal.createdAt || Date.now());
          deadlineDate.setDate(deadlineDate.getDate() + 7);
          const deadlineStr = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const isOverdue = (proposal.status === 'Proposed' || proposal.status === 'Pending Review' || proposal.status === 'PendingReview') && new Date() > deadlineDate;
          const escalated = isOverdue;
          const informationComplete = proposal.status !== 'Proposed';

          const handleUpdateStatus = async (status: string, rejectReason?: string) => {
            try {
              await seriesService.updateProposalStatus(proposal.id, status, rejectReason)
              const displayStatus = (status === 'BoardVoting') ? 'Board Voting' : status;
              toast.success(`Proposal status successfully updated to "${displayStatus}"!`)
              setShowRejectInput(false)
              setRejectReasonText('')
              setSelectedProposalId(null)
              onRefresh()
            } catch (e: any) {
              toast.error(e.message || `Failed to update status to ${status}`)
            }
          }

          const handleRejectSubmit = async () => {
            if (!rejectReasonText.trim()) {
              toast.error('Please provide a reason for rejection')
              return
            }
            await handleUpdateStatus('Rejected', rejectReasonText.trim())
          }

          return (
            <div className="space-y-6">
              {/* Back header */}
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <button
                  onClick={() => {
                    setSelectedProposalId(null);
                    setShowRejectInput(false);
                    setRejectReasonText('');
                  }}
                  className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all cursor-pointer"
                  title="Back to List"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-foreground">
                    Review Proposal: {proposal.title}
                  </h2>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                    Submitted by {proposal.author} • Status: {getIntakeStatusBadge(proposal.status)}
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                    {escalated && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" /> Escalated
                      </span>
                    )}
                    {informationComplete && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> Info Complete
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 grid-flow-row xl:grid-cols-3 gap-6">
                {/* Left: Combined Cover, Metadata & Evaluation Panel */}
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                    <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                      Cover Artwork, Metadata & Evaluation
                    </h3>

                    {/* Cover Artwork */}
                    {proposal.coverImagePublicUrl ? (
                      <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proposal.coverImagePublicUrl}
                          alt={proposal.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`aspect-[3/4] rounded-lg bg-gradient-to-br ${proposal.coverColor || 'from-primary to-primary/60'} p-6 flex flex-col justify-between text-white shadow-sm`}>
                        <div className="w-8 h-8 rounded-md bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xs uppercase">
                          MF
                        </div>
                        <span className="font-black text-base tracking-tight leading-snug drop-shadow-sm">
                          {proposal.title}
                        </span>
                        <span className="text-[10px] font-medium opacity-80">
                          By {proposal.author}
                        </span>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-1 gap-3 pt-1 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider">Mangaka</span>
                        <span className="font-extrabold text-foreground text-sm block truncate">{proposal.author}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider">Publication Type</span>
                        <span className="font-bold text-foreground capitalize block">{proposal.type || 'Weekly'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider">Genre</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {parseGenres(proposal.genre).length > 0 ? (
                            parseGenres(proposal.genre).map((g: string) => (
                              <span key={g} className="bg-muted px-2 py-0.5 rounded-md text-[10px] font-bold text-muted-foreground border border-border/40">
                                {g}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs italic">N/A</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Extra Metadata Details */}
                    <div className="space-y-2 pt-2 text-xs border-t border-border/40">
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground font-semibold">Date Submitted</span>
                        <span className="font-bold text-foreground">
                          {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : (proposal.status === 'Draft' ? 'Draft' : 'N/A')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground font-semibold">Review Deadline</span>
                        <span className={`font-bold ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                          {deadlineStr}
                        </span>
                      </div>
                    </div>

                    {/* Evaluation Section */}
                    <div className="pt-4 border-t border-border/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                          Direct Editor Evaluation
                        </h4>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20">
                          ACTION REQUIRED
                        </span>
                      </div>

                      {/* Show evaluation panel for proposals pending Tantou action: UnderReview from BE */}
                      {['UnderReview', 'Under Review', 'Proposed', 'PendingReview', 'Pending Review'].includes(proposal.status) ? (
                        <div className="space-y-4">
                          <div className="p-3 bg-muted/30 border border-border/80 rounded-lg space-y-1.5">
                            <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Your Evaluation
                            </h4>
                            <p className="text-[10px] text-muted-foreground leading-normal">
                              As the assigned Tantou Editor, you must review this submission.
                              Approving it changes its status to <strong>Board Voting</strong>. Rejecting it marks it as <strong>Rejected</strong>.
                            </p>
                          </div>

                          {showRejectInput ? (
                            <div className="p-3.5 rounded-lg bg-destructive/5 border border-destructive/20 space-y-3 animate-in slide-in-from-top-2">
                              <label className="text-xs font-extrabold text-destructive flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Rejection Reason
                              </label>
                              <textarea
                                value={rejectReasonText}
                                onChange={(e) => setRejectReasonText(e.target.value)}
                                placeholder="Explain why this proposal is being rejected... (This will be sent to the Mangaka)"
                                className="w-full p-2.5 bg-card border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 text-foreground resize-none"
                                rows={4}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setShowRejectInput(false);
                                    setRejectReasonText('');
                                  }}
                                  className="px-2.5 py-1.5 border border-border rounded-md text-xs font-bold hover:bg-muted text-muted-foreground"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleRejectSubmit}
                                  className="px-2.5 py-1.5 bg-destructive hover:bg-destructive/95 text-destructive-foreground rounded-md text-xs font-bold"
                                >
                                  Confirm Rejection
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                              <button
                                onClick={() => handleUpdateStatus('BoardVoting')}
                                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Send to Board
                              </button>
                              <button
                                onClick={() => setShowRejectInput(true)}
                                className="flex-1 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black text-[10px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                              >
                                <X className="w-3.5 h-3.5" /> Reject Proposal
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-4 bg-muted/40 border border-border rounded-lg flex items-center gap-3">
                            {proposal.status === 'Board Voting' || proposal.status === 'BoardVoting' ? (
                              <>
                                <Clock className="w-7 h-7 text-amber-500 shrink-0" />
                                <div className="space-y-0.5">
                                  <p className="text-[11px] font-extrabold text-foreground">Under Board Review</p>
                                  <p className="text-[9px] text-muted-foreground">Currently being voted on by the Editorial Board.</p>
                                </div>
                              </>
                            ) : proposal.status === 'Approved' || proposal.status === 'Active' ? (
                              <>
                                <CheckCircle2 className="w-7 h-7 text-primary shrink-0" />
                                <div className="space-y-0.5">
                                  <p className="text-[11px] font-extrabold text-foreground">
                                    {proposal.rawStatus === 'Approved' ? 'Proposal Approved' : 'Approved & Active'}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground">
                                    {proposal.rawStatus === 'Approved'
                                      ? 'Approved by the Editorial Board. You can now activate it.'
                                      : 'Approved and activated as an official series.'}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-7 h-7 text-destructive shrink-0" />
                                <div className="space-y-0.5">
                                  <p className="text-[11px] font-extrabold text-foreground">Proposal Rejected</p>
                                  <p className="text-[9px] text-muted-foreground">This proposal has been rejected.</p>
                                </div>
                              </>
                            )}
                          </div>

                          {proposal.rawStatus === 'Approved' && (
                            <div className="pt-1">
                              <button
                                onClick={() => handleUpdateStatus('Active')}
                                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Activate Series
                              </button>
                            </div>
                          )}

                          {proposal.status === 'Rejected' && proposal.rejectReason && (
                            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-1 text-[11px]">
                              <p className="text-[9px] font-extrabold text-destructive uppercase tracking-wider">
                                Editor Rejection Feedback:
                              </p>
                              <p className="text-muted-foreground italic leading-normal">
                                "{proposal.rejectReason}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Synopsis & Actions */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Synopsis Card */}
                  <div className="bg-card border border-border p-6 rounded-xl space-y-4 shadow-sm">
                    <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                      Proposal Synopsis
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                      {proposal.description || 'No synopsis provided.'}
                    </p>
                  </div>

                  {/* ZIP File Attachment Panel */}
                  {proposal.sourceZipPublicUrl || proposal.sourceZipFile || proposal.sourceZipFileAssetId || proposal.sampleFileUrl ? (
                    (() => {
                      const zipDownloadUrl = proposal.sourceZipPublicUrl
                        || proposal.sourceZipFile?.url
                        || (proposal.sourceZipFileAssetId
                          ? `${API_BASE_URL}/api/files/${proposal.sourceZipFileAssetId}`
                          : proposal.sampleFileUrl?.startsWith('http')
                            ? proposal.sampleFileUrl
                            : proposal.sampleFileUrl
                              ? `${API_BASE_URL}/api/files/${proposal.sampleFileUrl}`
                              : '');

                      const zipFileName = proposal.sourceZipFile?.fileName
                        || (proposal.sourceZipFileAssetId || proposal.sourceZipPublicUrl
                          ? `source_manuscript_${proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.zip`
                          : `sample_pages_${proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.zip`);

                      const isLegacy = !proposal.sourceZipPublicUrl && !proposal.sourceZipFile && !proposal.sourceZipFileAssetId && !!proposal.sampleFileUrl;

                      return (
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-6 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isLegacy ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                              {isLegacy ? <FileText className="w-6 h-6" /> : <FileArchive className="w-6 h-6" />}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-foreground">
                                {isLegacy ? 'Attached Sample Images Package' : 'Attached ZIP Manuscript Package'}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {isLegacy ? 'Legacy comma-separated image file sequence' : 'Original source files uploaded by the Mangaka'}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 bg-muted/30 border border-border/80 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground truncate">
                                {zipFileName}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                URL: {zipDownloadUrl}
                              </p>
                            </div>
                            <a
                              href={zipDownloadUrl}
                              download={zipFileName}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold rounded-lg transition-all shadow-sm flex-shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                            >
                              <Download className="w-4 h-4" /> Download ZIP
                            </a>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-sm min-h-[160px]">
                      <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground/40">
                        <FileArchive className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-foreground">No ZIP Package Uploaded</h4>
                        <p className="text-[10px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                          This proposal does not have any attached ZIP packages or sample files from the creator.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )
        })()
      ) : (
        /* Proposal List View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-foreground">Proposal Review</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Manage and evaluate proposals submitted by your assigned Mangakas.
              </p>
            </div>
            <div className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full shrink-0">
              {supervisedSeries.filter(p => (p.status || '').toLowerCase() !== 'draft').length} Total Proposals
            </div>
          </div>

          {/* Filters & Search Row */}
          <div className="flex flex-col gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search proposals by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-lg text-xs focus:outline-none focus:border-primary/40 text-foreground"
                />
              </div>

              {/* Status selection */}
              <div className="relative">
                <select
                  value={proposalFilter}
                  onChange={(e) => setProposalFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-lg text-xs text-foreground focus:outline-none appearance-none cursor-pointer font-bold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Under Review">Under Review (Awaiting Your Decision)</option>
                  <option value="BoardVoting">Board Voting (At Editorial Board)</option>
                  <option value="Approved">Approved / Active</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Proposals List Grid */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-16 text-center space-y-4">
                <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <div>
                  <h3 className="font-bold text-lg text-foreground">No proposals found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters or search terms.
                  </p>
                </div>
              </div>
            ) : (
              filtered.map((proposal) => {
                const deadlineDate = proposal.submittedAt ? new Date(proposal.submittedAt) : new Date(proposal.createdAt || Date.now());
                deadlineDate.setDate(deadlineDate.getDate() + 7);
                const deadlineStr = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const isOverdue = (proposal.status === 'Under Review' || proposal.status === 'UnderReview') && new Date() > deadlineDate;
                const escalated = isOverdue;
                const informationComplete = proposal.status !== 'UnderReview' && proposal.status !== 'Under Review';
                const isRejected = proposal.status?.toLowerCase() === 'rejected';
                const isApprovedOrActive = proposal.status?.toLowerCase() === 'approved' || proposal.status?.toLowerCase() === 'active';

                return (
                  <div
                    key={proposal.id}
                    className="bg-card border border-border p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-xl hover:shadow-md transition-all"
                  >
                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-foreground text-base">{proposal.title}</h3>
                        {getIntakeStatusBadge(proposal.status)}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                          </span>
                        )}
                        {escalated && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" /> Escalated
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-6 gap-y-2">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Users className="w-3.5 h-3.5 text-primary" /> Author: <strong className="text-foreground">{proposal.author || 'Unknown'}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Submitted:{' '}
                          <strong className="text-foreground">
                            {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : (proposal.status === 'Draft' ? 'Draft' : 'N/A')}
                          </strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Deadline:{' '}
                          <strong className={isOverdue ? 'text-destructive font-bold' : 'text-foreground'}>
                            {deadlineStr}
                          </strong>
                        </span>
                      </div>

                      <div className="flex gap-2 flex-wrap pt-0.5">
                        {informationComplete && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                            <CheckCircle className="w-3.5 h-3.5" /> Info Complete
                          </span>
                        )}
                        <span className="bg-muted px-2 py-0.5 rounded text-[9px] font-bold text-muted-foreground uppercase">
                          {proposal.type || 'Weekly'}
                        </span>
                        {proposal.genre?.slice(0, 2).map((g: string) => (
                          <span key={g} className="bg-primary/5 px-2 py-0.5 rounded text-[9px] font-bold text-primary border border-primary/10 uppercase">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 w-full md:w-auto">
                      {!isRejected && (
                        <button
                          onClick={() => setSelectedProposalId(proposal.id)}
                          className="w-full md:w-auto px-4 py-2.5 text-xs font-black rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <FileText className="w-4 h-4" />
                          {isApprovedOrActive ? 'View Details' : 'Review & Decide'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  )
}
